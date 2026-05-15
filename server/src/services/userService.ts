import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import {
	DEFAULT_SCHEDULE,
	DEFAULT_TIMEZONE,
	USERS_COLLECTION,
} from '../lib/constants';
import { getFirebaseAuth, getFirestoreDb } from '../lib/firebase';
import type {
	EmploymentType,
	UserLocation,
	UserProfile,
	UserRole,
	UserSchedule,
} from '../types/models';

export class EmailAlreadyExistsError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'EmailAlreadyExistsError';
	}
}

export class ValidationError extends Error {
	field?: string;
	constructor(message: string, field?: string) {
		super(message);
		this.name = 'ValidationError';
		this.field = field;
	}
}

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

function isValidTimeString(value: unknown): value is string {
	return typeof value === 'string' && TIME_REGEX.test(value);
}

/**
 * Returns the sanitized schedule or throws a ValidationError.
 * Rejects malformed HH:MM, identical start/end, non-object input,
 * and malformed workingDays.
 */
export function assertValidSchedule(value: unknown): UserSchedule {
	if (!value || typeof value !== 'object') {
		throw new ValidationError(
			'Schedule must be an object with start and end times.',
			'schedule',
		);
	}
	const v = value as {
		start?: unknown;
		end?: unknown;
		workingDays?: unknown;
	};
	if (!isValidTimeString(v.start)) {
		throw new ValidationError(
			'Schedule start must be in HH:MM format (00:00–23:59).',
			'schedule.start',
		);
	}
	if (!isValidTimeString(v.end)) {
		throw new ValidationError(
			'Schedule end must be in HH:MM format (00:00–23:59).',
			'schedule.end',
		);
	}
	if (v.start === v.end) {
		throw new ValidationError(
			'Schedule start and end cannot be the same time.',
			'schedule',
		);
	}
	const result: UserSchedule = { start: v.start, end: v.end };
	if (v.workingDays !== undefined) {
		result.workingDays = assertValidWorkingDays(v.workingDays);
	}
	return result;
}

function assertValidWorkingDays(value: unknown): number[] {
	if (!Array.isArray(value)) {
		throw new ValidationError(
			'workingDays must be an array of day-of-week indices (0–6).',
			'schedule.workingDays',
		);
	}
	if (value.length === 0) {
		throw new ValidationError(
			'Pick at least one working day.',
			'schedule.workingDays',
		);
	}
	const seen = new Set<number>();
	for (const raw of value) {
		if (
			typeof raw !== 'number' ||
			!Number.isInteger(raw) ||
			raw < 0 ||
			raw > 6
		) {
			throw new ValidationError(
				'Each working day must be an integer 0–6 (0=Sun … 6=Sat).',
				'schedule.workingDays',
			);
		}
		if (seen.has(raw)) {
			throw new ValidationError(
				'workingDays must not contain duplicates.',
				'schedule.workingDays',
			);
		}
		seen.add(raw);
	}
	return [...seen].sort((a, b) => a - b);
}

export type BootstrapInput = {
	uid: string;
	email: string | null;
	displayName?: string | null;
};

export async function getOrCreateUserProfile(
	input: BootstrapInput,
): Promise<UserProfile> {
	const db = getFirestoreDb();
	const ref = db.collection(USERS_COLLECTION).doc(input.uid);
	const snapshot = await ref.get();

	if (snapshot.exists) {
		return snapshot.data() as UserProfile;
	}

	const name =
		input.displayName?.trim() || input.email?.split('@')[0] || 'Employee';
	const email = input.email ?? '';

	await ref.set({
		uid: input.uid,
		name,
		email,
		role: 'employee',
		timezone: DEFAULT_TIMEZONE,
		schedule: { ...DEFAULT_SCHEDULE },
		createdAt: FieldValue.serverTimestamp(),
	});

	// Synthesize the return locally — avoids re-reading what we just wrote.
	return {
		uid: input.uid,
		name,
		email,
		role: 'employee' as UserRole,
		timezone: DEFAULT_TIMEZONE,
		schedule: { ...DEFAULT_SCHEDULE } as UserSchedule,
		createdAt: Timestamp.now(),
	};
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
	const db = getFirestoreDb();
	const snapshot = await db.collection(USERS_COLLECTION).doc(uid).get();
	return snapshot.exists ? (snapshot.data() as UserProfile) : null;
}

export type UpdatableProfileFields = {
	name?: string;
	timezone?: string;
	schedule?: UserSchedule;
};

export async function updateOwnProfile(
	uid: string,
	updates: UpdatableProfileFields,
): Promise<UserProfile> {
	const db = getFirestoreDb();
	const ref = db.collection(USERS_COLLECTION).doc(uid);

	const sanitized: Record<string, unknown> = {};
	if (updates.name !== undefined) {
		const trimmed = String(updates.name).trim();
		if (!trimmed) {
			throw new ValidationError('Name cannot be empty.', 'name');
		}
		sanitized.name = trimmed;
	}
	if (updates.timezone !== undefined) {
		const tz = String(updates.timezone).trim();
		if (!tz) {
			throw new ValidationError('Timezone cannot be empty.', 'timezone');
		}
		if (!isValidTimezone(tz)) {
			throw new ValidationError(`Invalid timezone: ${tz}`, 'timezone');
		}
		sanitized.timezone = tz;
	}
	if (updates.schedule !== undefined) {
		sanitized.schedule = assertValidSchedule(updates.schedule);
	}

	if (Object.keys(sanitized).length > 0) {
		await ref.update(sanitized);
	}

	const snapshot = await ref.get();
	return snapshot.data() as UserProfile;
}

export type AdminUpdatableProfileFields = UpdatableProfileFields & {
	role?: UserRole;
	email?: string;
	location?: UserLocation;
	employmentType?: EmploymentType;
};

export async function adminUpdateProfile(
	uid: string,
	updates: AdminUpdatableProfileFields,
): Promise<UserProfile> {
	const db = getFirestoreDb();
	const ref = db.collection(USERS_COLLECTION).doc(uid);

	const sanitized: Record<string, unknown> = {};
	if (updates.name !== undefined) {
		const trimmed = String(updates.name).trim();
		if (!trimmed) {
			throw new ValidationError('Name cannot be empty.', 'name');
		}
		sanitized.name = trimmed;
	}
	if (updates.email !== undefined) {
		const trimmed = String(updates.email).trim();
		if (!trimmed) {
			throw new ValidationError('Email cannot be empty.', 'email');
		}
		if (!isValidEmail(trimmed)) {
			throw new ValidationError('Email must be a valid address.', 'email');
		}
		sanitized.email = trimmed;
	}
	if (updates.role !== undefined) {
		if (updates.role !== 'admin' && updates.role !== 'employee') {
			throw new ValidationError(
				'Role must be either "admin" or "employee".',
				'role',
			);
		}
		sanitized.role = updates.role;
	}
	if (updates.timezone !== undefined) {
		const tz = String(updates.timezone).trim();
		if (!tz) {
			throw new ValidationError('Timezone cannot be empty.', 'timezone');
		}
		if (!isValidTimezone(tz)) {
			throw new ValidationError(`Invalid timezone: ${tz}`, 'timezone');
		}
		sanitized.timezone = tz;
	}
	if (updates.schedule !== undefined) {
		sanitized.schedule = assertValidSchedule(updates.schedule);
	}
	if (updates.location !== undefined) {
		if (!isValidLocation(updates.location)) {
			throw new ValidationError(
				'Location must be On-Site, Remote, or Hybrid.',
				'location',
			);
		}
		sanitized.location = updates.location;
	}
	if (updates.employmentType !== undefined) {
		if (!isValidEmploymentType(updates.employmentType)) {
			throw new ValidationError(
				'Employment type must be Full-time, Part-time, or Contractual.',
				'employmentType',
			);
		}
		sanitized.employmentType = updates.employmentType;
	}

	if (Object.keys(sanitized).length > 0) {
		await ref.update(sanitized);
	}

	const snapshot = await ref.get();
	return snapshot.data() as UserProfile;
}

export type CreateEmployeeInput = {
	name: string;
	email: string;
	password: string;
	role?: UserRole;
	timezone?: string;
	schedule?: UserSchedule;
	location?: UserLocation;
	employmentType?: EmploymentType;
};

export async function createEmployeeProfile(
	input: CreateEmployeeInput,
): Promise<UserProfile> {
	const name = input.name.trim();
	const email = input.email.trim();
	if (!name) throw new ValidationError('Name is required.', 'name');
	if (!email) throw new ValidationError('Email is required.', 'email');
	if (!isValidEmail(email)) {
		throw new ValidationError('Email must be a valid address.', 'email');
	}
	if (!input.password || input.password.length < 8) {
		throw new ValidationError(
			'Password must be at least 8 characters.',
			'password',
		);
	}

	const timezone = input.timezone ?? DEFAULT_TIMEZONE;
	if (!isValidTimezone(timezone)) {
		throw new ValidationError(`Invalid timezone: ${timezone}`, 'timezone');
	}
	const schedule: UserSchedule = input.schedule
		? assertValidSchedule(input.schedule)
		: { ...DEFAULT_SCHEDULE };
	const role: UserRole =
		input.role === 'admin' || input.role === 'employee'
			? input.role
			: 'employee';

	const auth = getFirebaseAuth();
	let userRecord: Awaited<ReturnType<typeof auth.createUser>>;
	try {
		userRecord = await auth.createUser({
			email,
			password: input.password,
			displayName: name,
		});
	} catch (error) {
		const code = (error as { code?: string } | null)?.code;
		if (code === 'auth/email-already-exists') {
			throw new EmailAlreadyExistsError('Email is already in use.');
		}
		throw error;
	}

	const uid = userRecord.uid;
	const db = getFirestoreDb();
	const ref = db.collection(USERS_COLLECTION).doc(uid);

	const doc: Record<string, unknown> = {
		uid,
		name,
		email,
		role,
		timezone,
		schedule,
		createdAt: FieldValue.serverTimestamp(),
	};
	if (isValidLocation(input.location)) {
		doc.location = input.location;
	}
	if (isValidEmploymentType(input.employmentType)) {
		doc.employmentType = input.employmentType;
	}

	await ref.set(doc);
	const created = await ref.get();
	return created.data() as UserProfile;
}

export async function listAllProfiles(): Promise<UserProfile[]> {
	const db = getFirestoreDb();
	const snapshot = await db.collection(USERS_COLLECTION).get();
	return snapshot.docs.map((doc) => doc.data() as UserProfile);
}

function isValidTimezone(tz: string): boolean {
	try {
		Intl.DateTimeFormat(undefined, { timeZone: tz });
		return true;
	} catch {
		return false;
	}
}

function isValidEmail(value: string): boolean {
	// Pragmatic check: one @, at least one char on each side, dot in domain.
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidLocation(value: unknown): value is UserLocation {
	return value === 'On-Site' || value === 'Remote' || value === 'Hybrid';
}

function isValidEmploymentType(value: unknown): value is EmploymentType {
	return (
		value === 'Full-time' || value === 'Part-time' || value === 'Contractual'
	);
}
