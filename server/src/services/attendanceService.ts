import { formatInTimeZone } from 'date-fns-tz';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { ATTENDANCE_COLLECTION } from '../lib/constants.js';
import { getFirestoreDb } from '../lib/firebase.js';
import type {
	AttendanceDoc,
	AttendanceEdit,
	ComputedAttendance,
	UserProfile,
} from '../types/models.js';
import { computeHours } from './computeService.js';
import { notifyEmployeeOfEdit } from './notificationService.js';
import { writeDailySummary } from './summaryService.js';
import { getUserProfile, ValidationError } from './userService.js';

export type AttendanceWithId = AttendanceDoc & { id: string };

export class AttendanceConflictError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'AttendanceConflictError';
	}
}

export class NotFoundError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'NotFoundError';
	}
}

export async function findActiveSession(
	uid: string,
): Promise<AttendanceWithId | null> {
	const db = getFirestoreDb();
	const snapshot = await db
		.collection(ATTENDANCE_COLLECTION)
		.where('userId', '==', uid)
		.where('status', '==', 'active')
		.limit(1)
		.get();

	const doc = snapshot.docs[0];
	if (!doc) return null;

	return { id: doc.id, ...(doc.data() as AttendanceDoc) };
}

export async function punchIn(profile: UserProfile): Promise<AttendanceWithId> {
	const db = getFirestoreDb();
	const now = new Date();
	const localDate = formatInTimeZone(now, profile.timezone, 'yyyy-MM-dd');
	const docId = `${profile.uid}_${localDate}_${now.getTime()}`;
	const newRef = db.collection(ATTENDANCE_COLLECTION).doc(docId);
	const timeIn = Timestamp.fromDate(now);

	await db.runTransaction(async (tx) => {
		const activeSnap = await tx.get(
			db
				.collection(ATTENDANCE_COLLECTION)
				.where('userId', '==', profile.uid)
				.where('status', '==', 'active')
				.limit(1),
		);
		if (!activeSnap.empty) {
			throw new AttendanceConflictError('User already has an active session.');
		}
		tx.set(newRef, {
			userId: profile.uid,
			date: localDate,
			timeIn,
			timeOut: null,
			status: 'active',
			computed: null,
			createdAt: FieldValue.serverTimestamp(),
			updatedAt: FieldValue.serverTimestamp(),
		});
	});

	// Synthesize the return locally — avoids an extra read after the write.
	// serverTimestamp resolves on the server; clients only see this synthesized
	// Timestamp.now() for the createdAt/updatedAt of the response, which is
	// within microseconds of the persisted value.
	return {
		id: docId,
		userId: profile.uid,
		date: localDate,
		timeIn,
		timeOut: null,
		status: 'active',
		computed: null,
		createdAt: Timestamp.now(),
		updatedAt: Timestamp.now(),
	};
}

export async function punchOut(
	profile: UserProfile,
): Promise<AttendanceWithId> {
	const db = getFirestoreDb();
	const active = await findActiveSession(profile.uid);
	if (!active) {
		throw new NotFoundError('No active session to punch out from.');
	}

	const timeOut = new Date();
	const computed = computeHours({
		timeIn: active.timeIn.toDate(),
		timeOut,
		schedule: profile.schedule,
		timezone: profile.timezone,
	});

	const ref = db.collection(ATTENDANCE_COLLECTION).doc(active.id);
	const timeOutTs = Timestamp.fromDate(timeOut);
	await ref.update({
		timeOut: timeOutTs,
		status: 'completed',
		computed,
		updatedAt: FieldValue.serverTimestamp(),
	});

	await writeDailySummary(db, profile.uid, active.date);

	// Synthesize the return locally — avoids the extra read after update.
	return {
		...active,
		id: active.id,
		timeOut: timeOutTs,
		status: 'completed',
		computed,
		updatedAt: Timestamp.now(),
	};
}

export async function getHistory(
	uid: string,
	startDate: string,
	endDate: string,
): Promise<AttendanceWithId[]> {
	const db = getFirestoreDb();
	const snapshot = await db
		.collection(ATTENDANCE_COLLECTION)
		.where('userId', '==', uid)
		.where('date', '>=', startDate)
		.where('date', '<=', endDate)
		.orderBy('date', 'desc')
		.orderBy('timeIn', 'desc')
		.get();

	return snapshot.docs.map((doc) => ({
		id: doc.id,
		...(doc.data() as AttendanceDoc),
	}));
}

/**
 * Single Firestore query that returns every attendance record for `date`
 * across all users. Replaces the previous "fetch per employee in a
 * Promise.all" pattern in Admin.tsx and AdminAttendance.tsx, which scaled
 * O(N employees) reads per page load.
 *
 * Uses the auto-created single-field index on `date` (no composite needed).
 */
export async function listAttendanceOnDate(
	date: string,
): Promise<AttendanceWithId[]> {
	const db = getFirestoreDb();
	const snapshot = await db
		.collection(ATTENDANCE_COLLECTION)
		.where('date', '==', date)
		.get();
	return snapshot.docs.map((doc) => ({
		id: doc.id,
		...(doc.data() as AttendanceDoc),
	}));
}

export type AdminUpdateAttendanceInput = {
	timeIn?: string;
	timeOut?: string | null;
	reason?: string;
	notify?: boolean;
};

const REASON_MAX_LENGTH = 500;

export async function adminUpdateAttendance(
	id: string,
	input: AdminUpdateAttendanceInput,
	actingUid: string,
): Promise<AttendanceWithId> {
	const db = getFirestoreDb();
	const ref = db.collection(ATTENDANCE_COLLECTION).doc(id);
	const snapshot = await ref.get();

	if (!snapshot.exists) {
		throw new NotFoundError('Attendance record not found.');
	}

	const existing = snapshot.data() as AttendanceDoc;
	const profile = await getUserProfile(existing.userId);
	if (!profile) {
		throw new NotFoundError('User profile not found for this attendance.');
	}

	if (!existing.timeIn) {
		throw new Error('Corrupted attendance record: missing timeIn.');
	}
	const prevTimeIn = existing.timeIn.toDate();
	const prevTimeOut = existing.timeOut?.toDate() ?? null;
	const nextTimeIn = parseDateOrThrow(input.timeIn, prevTimeIn);
	const nextTimeOut = parseTimeOutOrThrow(input.timeOut, prevTimeOut);

	let computed: ComputedAttendance | null = null;
	let status: AttendanceDoc['status'] = 'active';
	if (nextTimeOut) {
		if (nextTimeOut <= nextTimeIn) {
			throw new ValidationError('Clock-out must be after clock-in.', 'timeOut');
		}
		computed = computeHours({
			timeIn: nextTimeIn,
			timeOut: nextTimeOut,
			schedule: profile.schedule,
			timezone: profile.timezone,
		});
		status = 'completed';
	}

	const nextDate = formatInTimeZone(nextTimeIn, profile.timezone, 'yyyy-MM-dd');

	const reason = normalizeReason(input.reason);
	const edit: AttendanceEdit = {
		at: Timestamp.now(),
		by: actingUid,
		reason,
		before: {
			timeIn: prevTimeIn.toISOString(),
			timeOut: prevTimeOut ? prevTimeOut.toISOString() : null,
		},
		after: {
			timeIn: nextTimeIn.toISOString(),
			timeOut: nextTimeOut ? nextTimeOut.toISOString() : null,
		},
	};

	const nextTimeInTs = Timestamp.fromDate(nextTimeIn);
	const nextTimeOutTs = nextTimeOut ? Timestamp.fromDate(nextTimeOut) : null;
	await ref.update({
		timeIn: nextTimeInTs,
		timeOut: nextTimeOutTs,
		status,
		computed,
		date: nextDate,
		edits: FieldValue.arrayUnion(edit),
		updatedAt: FieldValue.serverTimestamp(),
	});

	// Summary totals only depend on (timeIn, timeOut, status, date) — schedule and
	// timezone come from the profile and don't change here. Skip the recompute when
	// none of those moved; reason-only edits are a no-op for the day's aggregates.
	const timeInChanged = nextTimeIn.getTime() !== prevTimeIn.getTime();
	const prevOutMs = prevTimeOut?.getTime() ?? null;
	const nextOutMs = nextTimeOut?.getTime() ?? null;
	const timeOutChanged = prevOutMs !== nextOutMs;
	const dateChanged = existing.date !== nextDate;
	const statusChanged = existing.status !== status;
	const materialChange =
		timeInChanged || timeOutChanged || dateChanged || statusChanged;
	// Heal legacy/corrupted summaries: a completed session with no computed payload
	// means the summary may be stale even if this edit didn't move any times.
	const needsHeal = status === 'completed' && existing.computed == null;
	if (materialChange || needsHeal) {
		const summaryJobs = [writeDailySummary(db, existing.userId, nextDate)];
		if (dateChanged) {
			summaryJobs.push(writeDailySummary(db, existing.userId, existing.date));
		}
		await Promise.all(summaryJobs);
	}

	if (input.notify) {
		await notifyEmployeeOfEdit(existing.userId, actingUid, reason, {
			attendanceId: id,
			date: nextDate,
		});
	}

	// Synthesize the return locally — avoids the extra read after update.
	// `arrayUnion(edit)` appends `edit` to the existing array; we replicate that
	// here without re-reading.
	return {
		...existing,
		id,
		timeIn: nextTimeInTs,
		timeOut: nextTimeOutTs,
		status,
		computed,
		date: nextDate,
		edits: [...(existing.edits ?? []), edit],
		updatedAt: Timestamp.now(),
	};
}

function normalizeReason(value: string | undefined): string | null {
	if (typeof value !== 'string') return null;
	const trimmed = value.trim();
	if (!trimmed) return null;
	return trimmed.slice(0, REASON_MAX_LENGTH);
}

export async function adminListAttendance(
	userId: string,
	startDate: string,
	endDate: string,
): Promise<AttendanceWithId[]> {
	return getHistory(userId, startDate, endDate);
}

function parseDateOrThrow(value: string | undefined, fallback: Date): Date {
	if (value === undefined) return fallback;
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) {
		throw new ValidationError(`Invalid clock-in date/time: ${value}`, 'timeIn');
	}
	return parsed;
}

function parseTimeOutOrThrow(
	value: string | null | undefined,
	fallback: Date | null,
): Date | null {
	if (value === undefined) return fallback;
	if (value === null) return null;
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) {
		throw new ValidationError(
			`Invalid clock-out date/time: ${value}`,
			'timeOut',
		);
	}
	return parsed;
}
