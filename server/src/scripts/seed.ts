import { formatInTimeZone } from 'date-fns-tz';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import {
	ATTENDANCE_COLLECTION,
	DAILY_SUMMARY_COLLECTION,
	DEFAULT_TIMEZONE,
	USERS_COLLECTION,
} from '../lib/constants';
import { getFirebaseAuth, getFirestoreDb } from '../lib/firebase';
import { computeHours } from '../services/computeService';
import type {
	AttendanceDoc,
	EmploymentType,
	UserLocation,
	UserProfile,
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
		schedule: { start: '08:00', end: '17:00' },
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
		schedule: { start: '22:00', end: '06:00' },
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

async function upsertProfile(user: SeedUser): Promise<UserProfile> {
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

	await ref.set(profile, { merge: true });
	const snapshot = await ref.get();
	return snapshot.data() as UserProfile;
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
	offsetMinutes = 0,
): Date {
	const base = new Date(
		`${localDate}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(
			2,
			'0',
		)}:00+08:00`,
	);
	return new Date(base.getTime() + offsetMinutes * 60_000);
}

function parseHM(value: string): [number, number] {
	const [h, m] = value.split(':').map((n) => Number.parseInt(n, 10));
	return [h ?? 0, m ?? 0];
}

function jitter(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shouldSkipDay(date: string): boolean {
	const day = new Date(`${date}T12:00:00Z`).getUTCDay();
	return day === 0 || day === 6;
}

async function seedAttendanceForUser(user: SeedUser): Promise<number> {
	const db = getFirestoreDb();
	const [startH, startM] = parseHM(user.schedule.start);
	const [endH, endM] = parseHM(user.schedule.end);
	const nightShift = user.schedule.end <= user.schedule.start;

	let written = 0;

	for (let offset = DAYS_OF_HISTORY; offset >= 1; offset -= 1) {
		const date = pastDate(offset, user.timezone);
		if (shouldSkipDay(date)) continue;

		const lateMin = jitter(-10, 25);
		const overtimeMin = jitter(-15, 60);

		const timeIn = localToUtcDate(date, startH, startM, lateMin);

		const outDate = nightShift ? addDaysToDateString(date, 1) : date;
		const timeOut = localToUtcDate(outDate, endH, endM, overtimeMin);

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

		await db.collection(ATTENDANCE_COLLECTION).doc(docId).set(attendance);

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
			updatedAt: FieldValue.serverTimestamp(),
		};
		await db
			.collection(DAILY_SUMMARY_COLLECTION)
			.doc(`${user.uid}_${date}`)
			.set(summary);

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

		const batch = db.batch();
		for (const doc of attendance.docs) batch.delete(doc.ref);
		for (const doc of summaries.docs) batch.delete(doc.ref);
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
		`Reset complete — removed ${SEED_USERS.length} seed users and their data.`,
	);
}

async function main(): Promise<void> {
	const args = new Set(process.argv.slice(2));

	if (args.has('--reset')) {
		await resetSeedData();
		if (!args.has('--seed')) return;
	}

	console.log(`Seeding ${SEED_USERS.length} users…`);
	for (const user of SEED_USERS) {
		await upsertAuthUser(user);
		await upsertProfile(user);
		const days = await seedAttendanceForUser(user);
		console.log(
			`  · ${user.email} (${user.role}) — ${days} attendance days written`,
		);
	}

	console.log('\nDone. Sign-in credentials:');
	for (const user of SEED_USERS) {
		console.log(`  ${user.email} / ${user.password}  [${user.role}]`);
	}
}

main().catch((err) => {
	console.error('Seed failed:', err);
	process.exit(1);
});
