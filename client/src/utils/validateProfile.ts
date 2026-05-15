import type { UserSchedule } from '@/types/api';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export type FieldErrors = Partial<{
	name: string;
	email: string;
	password: string;
	timezone: string;
	'schedule.start': string;
	'schedule.end': string;
	'schedule.workingDays': string;
	schedule: string;
}>;

export function validateTimeString(value: string): string | null {
	if (!value) return 'Required.';
	if (!TIME_REGEX.test(value)) return 'Use HH:MM (00:00–23:59).';
	return null;
}

export function validateSchedule(
	start: string,
	end: string,
	workingDays?: number[],
): FieldErrors {
	const errors: FieldErrors = {};
	const startError = validateTimeString(start);
	const endError = validateTimeString(end);
	if (startError) errors['schedule.start'] = startError;
	if (endError) errors['schedule.end'] = endError;
	if (!startError && !endError && start === end) {
		errors.schedule = 'Start and end cannot be the same time.';
	}
	if (workingDays !== undefined) {
		const wdError = validateWorkingDays(workingDays);
		if (wdError) errors['schedule.workingDays'] = wdError;
	}
	return errors;
}

export function validateWorkingDays(days: number[]): string | null {
	if (days.length === 0) return 'Pick at least one working day.';
	const seen = new Set<number>();
	for (const d of days) {
		if (!Number.isInteger(d) || d < 0 || d > 6) {
			return 'Working day values must be 0–6.';
		}
		if (seen.has(d)) return 'Duplicate day.';
		seen.add(d);
	}
	return null;
}

export function sanitizedSchedule(
	start: string,
	end: string,
): UserSchedule | null {
	const errors = validateSchedule(start, end);
	if (Object.keys(errors).length > 0) return null;
	return { start, end };
}

export function validateName(value: string): string | null {
	if (!value.trim()) return 'Required.';
	return null;
}

export function validateEmail(value: string): string | null {
	const trimmed = value.trim();
	if (!trimmed) return 'Required.';
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
		return 'Enter a valid email address.';
	}
	return null;
}

export function validatePassword(value: string): string | null {
	if (!value) return 'Required.';
	if (value.length < 8) return 'Must be at least 8 characters.';
	return null;
}

export function validateTimezone(value: string): string | null {
	const trimmed = value.trim();
	if (!trimmed) return 'Required.';
	try {
		Intl.DateTimeFormat(undefined, { timeZone: trimmed });
		return null;
	} catch {
		return 'Not a recognized timezone (e.g. Asia/Manila).';
	}
}

export function hasErrors(errors: FieldErrors): boolean {
	return Object.values(errors).some((v) => Boolean(v));
}
