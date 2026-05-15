import { FieldValue } from 'firebase-admin/firestore';
import {
	DEFAULT_SCHEDULE,
	DEFAULT_TIMEZONE,
	USERS_COLLECTION,
} from '../lib/constants';
import { getFirestoreDb } from '../lib/firebase';
import type { UserProfile, UserRole, UserSchedule } from '../types/models';

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

	const newProfile = {
		uid: input.uid,
		name: input.displayName?.trim() || input.email?.split('@')[0] || 'Employee',
		email: input.email ?? '',
		role: 'employee' as UserRole,
		timezone: DEFAULT_TIMEZONE,
		schedule: { ...DEFAULT_SCHEDULE } as UserSchedule,
		createdAt: FieldValue.serverTimestamp(),
	};

	await ref.set(newProfile);
	const created = await ref.get();
	return created.data() as UserProfile;
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
	if (typeof updates.name === 'string') {
		sanitized.name = updates.name.trim();
	}
	if (typeof updates.timezone === 'string' && updates.timezone.length > 0) {
		if (!isValidTimezone(updates.timezone)) {
			throw new Error(`Invalid timezone: ${updates.timezone}`);
		}
		sanitized.timezone = updates.timezone;
	}
	if (updates.schedule && isValidSchedule(updates.schedule)) {
		sanitized.schedule = updates.schedule;
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
};

export async function adminUpdateProfile(
	uid: string,
	updates: AdminUpdatableProfileFields,
): Promise<UserProfile> {
	const db = getFirestoreDb();
	const ref = db.collection(USERS_COLLECTION).doc(uid);

	const sanitized: Record<string, unknown> = {};
	if (typeof updates.name === 'string') {
		sanitized.name = updates.name.trim();
	}
	if (typeof updates.email === 'string' && updates.email.length > 0) {
		sanitized.email = updates.email.trim();
	}
	if (updates.role === 'admin' || updates.role === 'employee') {
		sanitized.role = updates.role;
	}
	if (typeof updates.timezone === 'string' && updates.timezone.length > 0) {
		if (!isValidTimezone(updates.timezone)) {
			throw new Error(`Invalid timezone: ${updates.timezone}`);
		}
		sanitized.timezone = updates.timezone;
	}
	if (updates.schedule && isValidSchedule(updates.schedule)) {
		sanitized.schedule = updates.schedule;
	}

	if (Object.keys(sanitized).length > 0) {
		await ref.update(sanitized);
	}

	const snapshot = await ref.get();
	return snapshot.data() as UserProfile;
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

function isValidSchedule(value: unknown): value is UserSchedule {
	if (!value || typeof value !== 'object') {
		return false;
	}
	const v = value as { start?: unknown; end?: unknown };
	return (
		typeof v.start === 'string' &&
		typeof v.end === 'string' &&
		/^([01]\d|2[0-3]):[0-5]\d$/.test(v.start) &&
		/^([01]\d|2[0-3]):[0-5]\d$/.test(v.end)
	);
}
