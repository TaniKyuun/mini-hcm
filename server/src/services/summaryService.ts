import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import {
	ATTENDANCE_COLLECTION,
	DAILY_SUMMARY_COLLECTION,
} from '../lib/constants';
import { getFirestoreDb } from '../lib/firebase';
import type {
	AttendanceDoc,
	ComputedAttendance,
	DailySummaryDoc,
} from '../types/models';

export async function writeDailySummary(
	db: Firestore,
	uid: string,
	date: string,
): Promise<DailySummaryDoc> {
	const sessionsSnapshot = await db
		.collection(ATTENDANCE_COLLECTION)
		.where('userId', '==', uid)
		.where('date', '==', date)
		.where('status', '==', 'completed')
		.get();

	const totals: ComputedAttendance = {
		regularHours: 0,
		overtimeHours: 0,
		nightDifferentialHours: 0,
		lateMinutes: 0,
		undertimeMinutes: 0,
	};

	for (const doc of sessionsSnapshot.docs) {
		const data = doc.data() as AttendanceDoc;
		if (!data.computed) continue;
		totals.regularHours += data.computed.regularHours;
		totals.overtimeHours += data.computed.overtimeHours;
		totals.nightDifferentialHours += data.computed.nightDifferentialHours;
		totals.lateMinutes += data.computed.lateMinutes;
		totals.undertimeMinutes += data.computed.undertimeMinutes;
	}

	const summary = {
		userId: uid,
		date,
		regularHours: round2(totals.regularHours),
		overtimeHours: round2(totals.overtimeHours),
		nightDifferentialHours: round2(totals.nightDifferentialHours),
		lateMinutes: totals.lateMinutes,
		undertimeMinutes: totals.undertimeMinutes,
		totalHours: round2(
			totals.regularHours +
				totals.overtimeHours +
				totals.nightDifferentialHours,
		),
		sessionsCount: sessionsSnapshot.size,
		updatedAt: FieldValue.serverTimestamp(),
	};

	const docId = `${uid}_${date}`;
	await db.collection(DAILY_SUMMARY_COLLECTION).doc(docId).set(summary);

	const created = await db
		.collection(DAILY_SUMMARY_COLLECTION)
		.doc(docId)
		.get();
	return created.data() as DailySummaryDoc;
}

export async function readDailySummary(
	uid: string,
	date: string,
): Promise<DailySummaryDoc | null> {
	const db = getFirestoreDb();
	const docId = `${uid}_${date}`;
	const snapshot = await db
		.collection(DAILY_SUMMARY_COLLECTION)
		.doc(docId)
		.get();
	return snapshot.exists ? (snapshot.data() as DailySummaryDoc) : null;
}

export async function readWeeklySummaries(
	uid: string,
	startDate: string,
): Promise<DailySummaryDoc[]> {
	const dates = buildWeekDates(startDate);
	const db = getFirestoreDb();

	const snapshots = await Promise.all(
		dates.map((date) =>
			db.collection(DAILY_SUMMARY_COLLECTION).doc(`${uid}_${date}`).get(),
		),
	);

	return snapshots.map((snapshot, index) => {
		if (snapshot.exists) {
			return snapshot.data() as DailySummaryDoc;
		}
		const date = dates[index] ?? startDate;
		return emptyDailySummary(uid, date);
	});
}

export async function listAllDailySummariesOnDate(
	date: string,
): Promise<DailySummaryDoc[]> {
	const db = getFirestoreDb();
	const snapshot = await db
		.collection(DAILY_SUMMARY_COLLECTION)
		.where('date', '==', date)
		.get();
	return snapshot.docs.map((doc) => doc.data() as DailySummaryDoc);
}

export async function listAllDailySummariesInRange(
	startDate: string,
	endDate: string,
): Promise<DailySummaryDoc[]> {
	const db = getFirestoreDb();
	const snapshot = await db
		.collection(DAILY_SUMMARY_COLLECTION)
		.where('date', '>=', startDate)
		.where('date', '<=', endDate)
		.get();
	return snapshot.docs.map((doc) => doc.data() as DailySummaryDoc);
}

export function buildWeekDates(startDate: string): string[] {
	const result: string[] = [];
	const base = new Date(`${startDate}T12:00:00Z`);
	for (let i = 0; i < 7; i += 1) {
		const d = new Date(base);
		d.setUTCDate(base.getUTCDate() + i);
		result.push(d.toISOString().slice(0, 10));
	}
	return result;
}

function emptyDailySummary(uid: string, date: string): DailySummaryDoc {
	return {
		userId: uid,
		date,
		regularHours: 0,
		overtimeHours: 0,
		nightDifferentialHours: 0,
		lateMinutes: 0,
		undertimeMinutes: 0,
		totalHours: 0,
		sessionsCount: 0,
		updatedAt: null,
	};
}

function round2(value: number): number {
	return Math.round(value * 100) / 100;
}
