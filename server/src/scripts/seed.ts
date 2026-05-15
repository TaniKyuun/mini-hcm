import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import { type BulkWriter, FieldValue, Timestamp } from 'firebase-admin/firestore';
import {
	ATTENDANCE_COLLECTION,
	DAILY_SUMMARY_COLLECTION,
	DEFAULT_TIMEZONE,
	NOTIFICATIONS_COLLECTION,
	USERS_COLLECTION,
} from '../lib/constants';
import { getFirebaseAuth, getFirestoreDb } from '../lib/firebase';
import { isWorkingDay } from '../lib/workingDays';
import { computeHours } from '../services/computeService';
import type {
	AttendanceDoc,
	EmploymentType,
	UserLocation,
	UserRole,
	UserSchedule,
} from '../types/models';

type SeedUser = {
	uid: string;
	email: string;
	password: string;
	name: string;
	role: UserRole;
	timezone: string;
	schedule: UserSchedule;
	location: UserLocation;
	employmentType: EmploymentType;
};

const SEED_USERS: SeedUser[] = [
	{
		uid: 'seed-admin-001',
		email: 'admin@email.com',
		password: 'admin123',
		name: 'Ada Lovelace',
		role: 'admin',
		timezone: DEFAULT_TIMEZONE,
		// Mon–Fri (default - `workingDays` omitted)
		schedule: { start: '09:00', end: '18:00' },
		location: 'On-Site',
		employmentType: 'Full-time',
	},
	{
		uid: 'seed-emp-001',
		email: 'grace@email.com',
		password: 'user123',
		name: 'Grace Hopper',
		role: 'employee',
		timezone: DEFAULT_TIMEZONE,
		// Mon–Fri (default - `workingDays` omitted)
		schedule: { start: '09:00', end: '18:00' },
		location: 'Hybrid',
		employmentType: 'Full-time',
	},
	{
		uid: 'seed-emp-002',
		email: 'linus@email.com',
		password: 'user123',
		name: 'Linus Torvalds',
		role: 'employee',
		timezone: DEFAULT_TIMEZONE,
		// Six-day work week (Mon–Sat) to demo weekend support
		schedule: {
			start: '08:00',
			end: '17:00',
			workingDays: [1, 2, 3, 4, 5, 6],
		},
		location: 'Remote',
		employmentType: 'Full-time',
	},
	{
		uid: 'seed-emp-003',
		email: 'margaret@email.com',
		password: 'user123',
		name: 'Margaret Hamilton',
		role: 'employee',
		timezone: DEFAULT_TIMEZONE,
		// Mon–Fri (default)
		schedule: { start: '10:00', end: '19:00' },
		location: 'On-Site',
		employmentType: 'Part-time',
	},
	{
		uid: 'seed-emp-night',
		email: 'alan@email.com',
		password: 'user123',
		name: 'Alan Turing',
		role: 'employee',
		timezone: DEFAULT_TIMEZONE,
		// Tue–Sat overnight shift (off Sun + Mon)
		schedule: {
			start: '22:00',
			end: '06:00',
			workingDays: [2, 3, 4, 5, 6],
		},
		location: 'On-Site',
		employmentType: 'Contractual',
	},
];

const DAYS_OF_HISTORY = 14;

async function upsertAuthUser(user: SeedUser): Promise<void> {
	const auth = getFirebaseAuth();

	try {
		await auth.updateUser(user.uid, {
			email: user.email,
			emailVerified: true,
			displayName: user.name,
			password: user.password,
		});
		return;
	} catch (err) {
		const code = (err as { code?: string }).code;
		if (
			code !== 'auth/user-not-found' &&
			code !== 'auth/email-already-exists'
		) {
			throw err;
		}
	}

	try {
		const existing = await auth.getUserByEmail(user.email);
		if (existing.uid !== user.uid) {
			await auth.deleteUser(existing.uid);
		}
	} catch (err) {
		const code = (err as { code?: string }).code;
		if (code !== 'auth/user-not-found') throw err;
	}

	await auth.createUser({
		uid: user.uid,
		email: user.email,
		emailVerified: true,
		displayName: user.name,
		password: user.password,
	});
}

function upsertProfile(user: SeedUser, writer: BulkWriter): void {
	const db = getFirestoreDb();
	const ref = db.collection(USERS_COLLECTION).doc(user.uid);

	const profile = {
		uid: user.uid,
		name: user.name,
		email: user.email,
		role: user.role,
		timezone: user.timezone,
		schedule: user.schedule,
		location: user.location,
		employmentType: user.employmentType,
		createdAt: FieldValue.serverTimestamp(),
	};

	writer.set(ref, profile, { merge: true });
}

function pastDate(daysAgo: number, timezone: string): string {
	const now = new Date();
	now.setUTCDate(now.getUTCDate() - daysAgo);
	return formatInTimeZone(now, timezone, 'yyyy-MM-dd');
}

function localToUtcDate(
	localDate: string,
	hours: number,
	minutes: number,
	timezone: string,
	offsetMinutes = 0,
): Date {
	const localStr = `${localDate}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
	const base = fromZonedTime(localStr, timezone);
	return new Date(base.getTime() + offsetMinutes * 60_000);
}

function parseHM(value: string): [number, number] {
	const [h, m] = value.split(':').map((n) => Number.parseInt(n, 10));
	return [h ?? 0, m ?? 0];
}

function jitter(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function seedAttendanceForUser(user: SeedUser, writer: BulkWriter): number {
	const db = getFirestoreDb();
	const [startH, startM] = parseHM(user.schedule.start);
	const [endH, endM] = parseHM(user.schedule.end);
	const nightShift = user.schedule.end <= user.schedule.start;

	let written = 0;

	for (let offset = DAYS_OF_HISTORY; offset >= 1; offset -= 1) {
		const date = pastDate(offset, user.timezone);
		// Respect each user's working-days configuration (defaults to Mon–Fri).
		if (!isWorkingDay(user.schedule, date)) continue;

		const lateMin = jitter(-10, 25);

		const timeIn = localToUtcDate(date, startH, startM, user.timezone, lateMin);

		// Punch-out lands exactly on the scheduled end (no overtime in seed data).
		const outDate = nightShift ? addDaysToDateString(date, 1) : date;
		const timeOut = localToUtcDate(outDate, endH, endM, user.timezone, 0);

		const computed = computeHours({
			timeIn,
			timeOut,
			schedule: user.schedule,
			timezone: user.timezone,
		});

		const docId = `${user.uid}_${date}_${timeIn.getTime()}`;
		const attendance: AttendanceDoc = {
			userId: user.uid,
			date,
			timeIn: Timestamp.fromDate(timeIn),
			timeOut: Timestamp.fromDate(timeOut),
			status: 'completed',
			computed,
			createdAt: FieldValue.serverTimestamp() as unknown as Timestamp,
			updatedAt: FieldValue.serverTimestamp() as unknown as Timestamp,
		};

		writer.set(db.collection(ATTENDANCE_COLLECTION).doc(docId), attendance);

		const summary = {
			userId: user.uid,
			date,
			regularHours: computed.regularHours,
			overtimeHours: computed.overtimeHours,
			nightDifferentialHours: computed.nightDifferentialHours,
			lateMinutes: computed.lateMinutes,
			undertimeMinutes: computed.undertimeMinutes,
			totalHours: round2(
				computed.regularHours +
					computed.overtimeHours +
					computed.nightDifferentialHours,
			),
			sessionsCount: 1,
			firstTimeIn: Timestamp.fromDate(timeIn),
			lastTimeOut: Timestamp.fromDate(timeOut),
			updatedAt: FieldValue.serverTimestamp(),
		};
		writer.set(
			db.collection(DAILY_SUMMARY_COLLECTION).doc(`${user.uid}_${date}`),
			summary,
		);

		written += 1;
	}

	return written;
}

function addDaysToDateString(dateStr: string, days: number): string {
	const d = new Date(`${dateStr}T12:00:00Z`);
	d.setUTCDate(d.getUTCDate() + days);
	return d.toISOString().slice(0, 10);
}

function round2(value: number): number {
	return Math.round(value * 100) / 100;
}

/**
 * Seeds a handful of `punch_edited` notifications addressed to each non-admin
 * user, written by the seed admin. Useful for verifying the bell UI on first
 * load - the admin sees no notifications, employees see a small unread set.
 */
function seedNotifications(writer: BulkWriter): number {
	const adminUid = SEED_USERS.find((u) => u.role === 'admin')?.uid;
	if (!adminUid) return 0;

	const db = getFirestoreDb();
	const employees = SEED_USERS.filter((u) => u.role !== 'admin');
	let written = 0;
	for (const emp of employees) {
		// Two unread + one already-read sample so both states are visible.
		writer.set(db.collection(NOTIFICATIONS_COLLECTION).doc(), {
			recipientUid: emp.uid,
			actorUid: adminUid,
			type: 'punch_edited',
			read: false,
			title: 'Your time entry was edited',
			body: 'Reason: Adjusted clock-in to 09:05 (admin verified).',
			createdAt: FieldValue.serverTimestamp(),
		});
		writer.set(db.collection(NOTIFICATIONS_COLLECTION).doc(), {
			recipientUid: emp.uid,
			actorUid: adminUid,
			type: 'punch_edited',
			read: false,
			title: 'Your time entry was edited',
			body: 'Reason: Approved overtime for yesterday.',
			createdAt: FieldValue.serverTimestamp(),
		});
		writer.set(db.collection(NOTIFICATIONS_COLLECTION).doc(), {
			recipientUid: emp.uid,
			actorUid: adminUid,
			type: 'punch_edited',
			read: true,
			title: 'Your time entry was edited',
			body: 'Reason: Fixed missing punch-out from last week.',
			createdAt: FieldValue.serverTimestamp(),
		});
		written += 3;
	}
	return written;
}

async function resetSeedData(): Promise<void> {
	const db = getFirestoreDb();
	const auth = getFirebaseAuth();

	for (const user of SEED_USERS) {
		const attendance = await db
			.collection(ATTENDANCE_COLLECTION)
			.where('userId', '==', user.uid)
			.get();
		const summaries = await db
			.collection(DAILY_SUMMARY_COLLECTION)
			.where('userId', '==', user.uid)
			.get();
		const notifications = await db
			.collection(NOTIFICATIONS_COLLECTION)
			.where('recipientUid', '==', user.uid)
			.get();

		const batch = db.batch();
		for (const doc of attendance.docs) batch.delete(doc.ref);
		for (const doc of summaries.docs) batch.delete(doc.ref);
		for (const doc of notifications.docs) batch.delete(doc.ref);
		batch.delete(db.collection(USERS_COLLECTION).doc(user.uid));
		await batch.commit();

		try {
			await auth.deleteUser(user.uid);
		} catch (err) {
			const code = (err as { code?: string }).code;
			if (code !== 'auth/user-not-found') throw err;
		}

		try {
			const conflicting = await auth.getUserByEmail(user.email);
			if (conflicting.uid !== user.uid) {
				await auth.deleteUser(conflicting.uid);
			}
		} catch (err) {
			const code = (err as { code?: string }).code;
			if (code !== 'auth/user-not-found') throw err;
		}
	}
	console.log(
		`Reset complete - removed ${SEED_USERS.length} seed users and their data.`,
	);
}

async function main(): Promise<void> {
	const args = new Set(process.argv.slice(2));

	if (args.has('--reset')) {
		await resetSeedData();
		if (!args.has('--seed')) return;
	}

	const db = getFirestoreDb();
	const writer = db.bulkWriter();
	writer.onWriteError((err) => err.failedAttempts < 3);

	console.log(`Seeding ${SEED_USERS.length} users…`);
	for (const user of SEED_USERS) {
		await upsertAuthUser(user);
		upsertProfile(user, writer);
		const days = seedAttendanceForUser(user, writer);
		console.log(
			`  · ${user.email} (${user.role}) - ${days} attendance days queued`,
		);
	}

	const notifCount = seedNotifications(writer);
	console.log(`Queued ${notifCount} sample notifications.`);

	await writer.close();
	console.log('All writes committed.');

	console.log('\nDone. Sign-in credentials:');
	for (const user of SEED_USERS) {
		console.log(`  ${user.email} / ${user.password}  [${user.role}]`);
	}
}

main().catch((err) => {
	console.error('Seed failed:', err);
	process.exit(1);
});
