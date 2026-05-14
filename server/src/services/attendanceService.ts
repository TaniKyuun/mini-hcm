import { formatInTimeZone } from 'date-fns-tz';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { ATTENDANCE_COLLECTION } from '../lib/constants';
import { getFirestoreDb } from '../lib/firebase';
import type {
	AttendanceDoc,
	ComputedAttendance,
	UserProfile,
} from '../types/models';
import { computeHours } from './computeService';
import { writeDailySummary } from './summaryService';
import { getUserProfile } from './userService';

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
	const existing = await findActiveSession(profile.uid);
	if (existing) {
		throw new AttendanceConflictError('User already has an active session.');
	}

	const now = new Date();
	const localDate = formatInTimeZone(now, profile.timezone, 'yyyy-MM-dd');
	const docId = `${profile.uid}_${localDate}_${now.getTime()}`;

	const payload: AttendanceDoc = {
		userId: profile.uid,
		date: localDate,
		timeIn: Timestamp.fromDate(now),
		timeOut: null,
		status: 'active',
		computed: null,
		createdAt: FieldValue.serverTimestamp() as unknown as Timestamp,
		updatedAt: FieldValue.serverTimestamp() as unknown as Timestamp,
	};

	await db.collection(ATTENDANCE_COLLECTION).doc(docId).set(payload);
	const created = await db.collection(ATTENDANCE_COLLECTION).doc(docId).get();
	return { id: docId, ...(created.data() as AttendanceDoc) };
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
	await ref.update({
		timeOut: Timestamp.fromDate(timeOut),
		status: 'completed',
		computed,
		updatedAt: FieldValue.serverTimestamp(),
	});

	await writeDailySummary(db, profile.uid, active.date);

	const updated = await ref.get();
	return { id: active.id, ...(updated.data() as AttendanceDoc) };
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

export type AdminUpdateAttendanceInput = {
	timeIn?: string;
	timeOut?: string | null;
};

export async function adminUpdateAttendance(
	id: string,
	input: AdminUpdateAttendanceInput,
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

	const nextTimeIn = parseDateOrThrow(input.timeIn, existing.timeIn.toDate());
	const nextTimeOut = parseTimeOutOrThrow(
		input.timeOut,
		existing.timeOut?.toDate() ?? null,
	);

	let computed: ComputedAttendance | null = null;
	let status: AttendanceDoc['status'] = 'active';
	if (nextTimeOut) {
		computed = computeHours({
			timeIn: nextTimeIn,
			timeOut: nextTimeOut,
			schedule: profile.schedule,
			timezone: profile.timezone,
		});
		status = 'completed';
	}

	const nextDate = formatInTimeZone(nextTimeIn, profile.timezone, 'yyyy-MM-dd');

	await ref.update({
		timeIn: Timestamp.fromDate(nextTimeIn),
		timeOut: nextTimeOut ? Timestamp.fromDate(nextTimeOut) : null,
		status,
		computed,
		date: nextDate,
		updatedAt: FieldValue.serverTimestamp(),
	});

	await writeDailySummary(db, existing.userId, nextDate);
	if (existing.date !== nextDate) {
		await writeDailySummary(db, existing.userId, existing.date);
	}

	const updated = await ref.get();
	return { id, ...(updated.data() as AttendanceDoc) };
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
		throw new Error(`Invalid date value: ${value}`);
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
		throw new Error(`Invalid timeOut value: ${value}`);
	}
	return parsed;
}
