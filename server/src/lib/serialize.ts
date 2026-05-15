import type { Timestamp } from 'firebase-admin/firestore';
import type {
	AttendanceDoc,
	AttendanceEdit,
	AttendanceEditRequestDoc,
	DailySummaryDoc,
	NotificationDoc,
	UserProfile,
} from '../types/models';

function tsToIso(value: Timestamp | null | undefined): string | null {
	if (!value) return null;
	return value.toDate().toISOString();
}

export type SerializedProfile = Omit<UserProfile, 'createdAt'> & {
	createdAt: string | null;
};

export function serializeProfile(profile: UserProfile): SerializedProfile {
	return {
		...profile,
		createdAt: tsToIso(profile.createdAt),
	};
}

export type SerializedAttendanceEdit = Omit<AttendanceEdit, 'at'> & {
	at: string | null;
};

export type SerializedAttendance = Omit<
	AttendanceDoc,
	'timeIn' | 'timeOut' | 'edits' | 'createdAt' | 'updatedAt'
> & {
	id: string;
	timeIn: string;
	timeOut: string | null;
	edits: SerializedAttendanceEdit[];
	createdAt: string | null;
	updatedAt: string | null;
};

function serializeEdit(edit: AttendanceEdit): SerializedAttendanceEdit {
	return {
		...edit,
		at: tsToIso(edit.at),
	};
}

export function serializeAttendance(
	id: string,
	doc: AttendanceDoc,
): SerializedAttendance {
	const timeIn = tsToIso(doc.timeIn);
	if (!timeIn) {
		throw new Error(
			`serializeAttendance: missing required timeIn for id=${id} userId=${doc.userId}`,
		);
	}
	return {
		id,
		userId: doc.userId,
		date: doc.date,
		timeIn,
		timeOut: tsToIso(doc.timeOut),
		status: doc.status,
		computed: doc.computed,
		edits: (doc.edits ?? []).map(serializeEdit),
		createdAt: tsToIso(doc.createdAt),
		updatedAt: tsToIso(doc.updatedAt),
	};
}

export type SerializedDailySummary = Omit<
	DailySummaryDoc,
	'firstTimeIn' | 'lastTimeOut' | 'updatedAt'
> & {
	firstTimeIn: string | null;
	lastTimeOut: string | null;
	updatedAt: string | null;
};

export function serializeDailySummary(
	doc: DailySummaryDoc,
): SerializedDailySummary {
	return {
		...doc,
		firstTimeIn: tsToIso(doc.firstTimeIn),
		lastTimeOut: tsToIso(doc.lastTimeOut),
		updatedAt: tsToIso(doc.updatedAt),
	};
}

export type SerializedNotification = Omit<NotificationDoc, 'createdAt'> & {
	id: string;
	createdAt: string | null;
};

export function serializeNotification(
	id: string,
	doc: NotificationDoc,
): SerializedNotification {
	return {
		id,
		...doc,
		createdAt: tsToIso(doc.createdAt),
	};
}

export type SerializedEditRequest = Omit<
	AttendanceEditRequestDoc,
	'createdAt' | 'resolvedAt'
> & {
	id: string;
	createdAt: string | null;
	resolvedAt: string | null;
};

export function serializeEditRequest(
	id: string,
	doc: AttendanceEditRequestDoc,
): SerializedEditRequest {
	return {
		id,
		...doc,
		createdAt: tsToIso(doc.createdAt),
		resolvedAt: tsToIso(doc.resolvedAt),
	};
}
