import type { Timestamp } from 'firebase-admin/firestore';
import type {
	AttendanceDoc,
	DailySummaryDoc,
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

export type SerializedAttendance = Omit<
	AttendanceDoc,
	'timeIn' | 'timeOut' | 'createdAt' | 'updatedAt'
> & {
	id: string;
	timeIn: string;
	timeOut: string | null;
	createdAt: string | null;
	updatedAt: string | null;
};

export function serializeAttendance(
	id: string,
	doc: AttendanceDoc,
): SerializedAttendance {
	return {
		id,
		userId: doc.userId,
		date: doc.date,
		timeIn: tsToIso(doc.timeIn) ?? new Date(0).toISOString(),
		timeOut: tsToIso(doc.timeOut),
		status: doc.status,
		computed: doc.computed,
		createdAt: tsToIso(doc.createdAt),
		updatedAt: tsToIso(doc.updatedAt),
	};
}

export type SerializedDailySummary = Omit<DailySummaryDoc, 'updatedAt'> & {
	updatedAt: string | null;
};

export function serializeDailySummary(
	doc: DailySummaryDoc,
): SerializedDailySummary {
	return {
		...doc,
		updatedAt: tsToIso(doc.updatedAt),
	};
}
