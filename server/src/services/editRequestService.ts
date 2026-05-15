import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import {
	ATTENDANCE_COLLECTION,
	EDIT_REQUESTS_COLLECTION,
} from '../lib/constants';
import { getFirestoreDb } from '../lib/firebase';
import type {
	AttendanceDoc,
	AttendanceEditRequestDoc,
	EditRequestStatus,
} from '../types/models';
import { adminUpdateAttendance, NotFoundError } from './attendanceService';
import { createNotification } from './notificationService';
import { ValidationError } from './userService';

const REASON_MAX_LENGTH = 500;
const ADMIN_NOTE_MAX_LENGTH = 500;

export type CreateEditRequestInput = {
	attendanceId: string;
	requesterUid: string;
	requestedTimeIn?: string | null;
	requestedTimeOut?: string | null;
	reason: string;
};

export type EditRequestWithId = AttendanceEditRequestDoc & { id: string };

export async function createEditRequest(
	input: CreateEditRequestInput,
): Promise<EditRequestWithId> {
	const reason = input.reason?.trim() ?? '';
	if (!reason) {
		throw new ValidationError('Reason is required.', 'reason');
	}
	if (reason.length > REASON_MAX_LENGTH) {
		throw new ValidationError(
			`Reason cannot exceed ${REASON_MAX_LENGTH} characters.`,
			'reason',
		);
	}

	const requestedTimeIn = parseRequestedTime(input.requestedTimeIn, 'timeIn');
	const requestedTimeOut = parseRequestedTime(
		input.requestedTimeOut,
		'timeOut',
	);
	if (requestedTimeIn === null && requestedTimeOut === null) {
		throw new ValidationError(
			'Specify at least one of clock-in or clock-out to amend.',
			'request',
		);
	}

	const db = getFirestoreDb();
	const attendanceRef = db
		.collection(ATTENDANCE_COLLECTION)
		.doc(input.attendanceId);
	const attendanceSnap = await attendanceRef.get();
	if (!attendanceSnap.exists) {
		throw new NotFoundError('Attendance record not found.');
	}
	const attendance = attendanceSnap.data() as AttendanceDoc;
	if (attendance.userId !== input.requesterUid) {
		throw new ValidationError(
			'You can only request edits for your own attendance records.',
			'attendanceId',
		);
	}

	// Disallow stacking pending requests on the same record.
	const existing = await db
		.collection(EDIT_REQUESTS_COLLECTION)
		.where('attendanceId', '==', input.attendanceId)
		.where('status', '==', 'pending')
		.limit(1)
		.get();
	if (!existing.empty) {
		throw new ValidationError(
			'A pending edit request already exists for this record.',
			'attendanceId',
		);
	}

	const ref = await db.collection(EDIT_REQUESTS_COLLECTION).add({
		attendanceId: input.attendanceId,
		requesterUid: input.requesterUid,
		date: attendance.date,
		originalTimeIn: attendance.timeIn.toDate().toISOString(),
		originalTimeOut: attendance.timeOut
			? attendance.timeOut.toDate().toISOString()
			: null,
		requestedTimeIn,
		requestedTimeOut,
		reason,
		status: 'pending',
		createdAt: FieldValue.serverTimestamp(),
		resolvedAt: null,
		resolvedBy: null,
		adminNote: null,
	});

	// Synthesize the return locally — avoids re-reading what we just wrote.
	return {
		id: ref.id,
		attendanceId: input.attendanceId,
		requesterUid: input.requesterUid,
		date: attendance.date,
		originalTimeIn: attendance.timeIn.toDate().toISOString(),
		originalTimeOut: attendance.timeOut
			? attendance.timeOut.toDate().toISOString()
			: null,
		requestedTimeIn,
		requestedTimeOut,
		reason,
		status: 'pending',
		createdAt: Timestamp.now(),
		resolvedAt: null,
		resolvedBy: null,
		adminNote: null,
	};
}

export async function listEditRequestsForUser(
	requesterUid: string,
): Promise<EditRequestWithId[]> {
	const db = getFirestoreDb();
	const snap = await db
		.collection(EDIT_REQUESTS_COLLECTION)
		.where('requesterUid', '==', requesterUid)
		.get();
	return snap.docs.map((d) => ({
		id: d.id,
		...(d.data() as AttendanceEditRequestDoc),
	}));
}

export async function listEditRequests(
	status?: EditRequestStatus,
): Promise<EditRequestWithId[]> {
	const db = getFirestoreDb();
	let q: FirebaseFirestore.Query = db.collection(EDIT_REQUESTS_COLLECTION);
	if (status) {
		q = q.where('status', '==', status);
	}
	const snap = await q.get();
	return snap.docs.map((d) => ({
		id: d.id,
		...(d.data() as AttendanceEditRequestDoc),
	}));
}

export async function getEditRequest(
	id: string,
): Promise<EditRequestWithId | null> {
	const db = getFirestoreDb();
	const snap = await db.collection(EDIT_REQUESTS_COLLECTION).doc(id).get();
	if (!snap.exists) return null;
	return { id: snap.id, ...(snap.data() as AttendanceEditRequestDoc) };
}

/**
 * Approving applies the requested change via `adminUpdateAttendance` (so the
 * normal compute + summary + notify pipeline runs), then flips the request to
 * `approved` and notifies the employee.
 */
export async function approveEditRequest(
	id: string,
	adminUid: string,
	adminNote?: string,
): Promise<EditRequestWithId> {
	const note = normalizeNote(adminNote);
	const db = getFirestoreDb();
	const ref = db.collection(EDIT_REQUESTS_COLLECTION).doc(id);

	const snap = await ref.get();
	if (!snap.exists) {
		throw new NotFoundError('Edit request not found.');
	}
	const data = snap.data() as AttendanceEditRequestDoc;
	if (data.status !== 'pending') {
		throw new ValidationError(
			`Request is already ${data.status}.`,
			'status',
		);
	}

	// Apply the requested change. Any ValidationError thrown here (e.g. timeOut
	// <= timeIn after recompute) will bubble to the route → 400.
	await adminUpdateAttendance(
		data.attendanceId,
		{
			// null in the stored doc means "no change" — translate to undefined
			// so adminUpdateAttendance doesn't reinterpret null as "clear field".
			timeIn: data.requestedTimeIn ?? undefined,
			timeOut: data.requestedTimeOut ?? undefined,
			reason: `Approved edit request from employee: ${data.reason}`,
			notify: false, // we send our own notification below
		},
		adminUid,
	);

	const resolvedAt = Timestamp.now();
	await ref.update({
		status: 'approved',
		resolvedAt: FieldValue.serverTimestamp(),
		resolvedBy: adminUid,
		adminNote: note,
	});

	await createNotification({
		recipientUid: data.requesterUid,
		actorUid: adminUid,
		type: 'edit_request_approved',
		title: 'Your time-entry change was approved',
		body: note
			? `Admin note: ${note}`
			: 'Your requested clock-in/clock-out change has been applied.',
		metadata: { attendanceId: data.attendanceId, date: data.date },
	});

	// Synthesize the return locally — avoids re-reading what we just wrote.
	return {
		...data,
		id: ref.id,
		status: 'approved',
		resolvedAt,
		resolvedBy: adminUid,
		adminNote: note,
	};
}

export async function rejectEditRequest(
	id: string,
	adminUid: string,
	adminNote?: string,
): Promise<EditRequestWithId> {
	const note = normalizeNote(adminNote);
	const db = getFirestoreDb();
	const ref = db.collection(EDIT_REQUESTS_COLLECTION).doc(id);

	const snap = await ref.get();
	if (!snap.exists) {
		throw new NotFoundError('Edit request not found.');
	}
	const data = snap.data() as AttendanceEditRequestDoc;
	if (data.status !== 'pending') {
		throw new ValidationError(
			`Request is already ${data.status}.`,
			'status',
		);
	}

	const resolvedAt = Timestamp.now();
	await ref.update({
		status: 'rejected',
		resolvedAt: FieldValue.serverTimestamp(),
		resolvedBy: adminUid,
		adminNote: note,
	});

	await createNotification({
		recipientUid: data.requesterUid,
		actorUid: adminUid,
		type: 'edit_request_rejected',
		title: 'Your time-entry change was rejected',
		body: note
			? `Admin note: ${note}`
			: 'Your requested clock-in/clock-out change was not applied.',
		metadata: { attendanceId: data.attendanceId, date: data.date },
	});

	// Synthesize the return locally — avoids re-reading what we just wrote.
	return {
		...data,
		id: ref.id,
		status: 'rejected',
		resolvedAt,
		resolvedBy: adminUid,
		adminNote: note,
	};
}

/**
 * Parses a requested time value. `null`/`undefined`/empty-string all mean
 * "leave unchanged" (stored as `null` in the doc). A non-empty string must
 * parse to a valid Date — otherwise throws ValidationError.
 *
 * Employees can request to set a time but cannot request to *clear* one
 * (re-opening a session is an admin operation).
 */
function parseRequestedTime(
	value: string | null | undefined,
	field: 'timeIn' | 'timeOut',
): string | null {
	if (value === undefined || value === null) return null;
	const trimmed = value.trim();
	if (!trimmed) return null;
	const d = new Date(trimmed);
	if (Number.isNaN(d.getTime())) {
		throw new ValidationError(`Invalid ${field}: ${trimmed}`, field);
	}
	return d.toISOString();
}

function normalizeNote(value: string | undefined): string | null {
	if (typeof value !== 'string') return null;
	const trimmed = value.trim();
	if (!trimmed) return null;
	if (trimmed.length > ADMIN_NOTE_MAX_LENGTH) {
		throw new ValidationError(
			`Admin note cannot exceed ${ADMIN_NOTE_MAX_LENGTH} characters.`,
			'adminNote',
		);
	}
	return trimmed;
}
