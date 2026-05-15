import type { UserSchedule } from '@/types/api';

/** Mon (1) through Fri (5). */
export const DEFAULT_WORKING_DAYS: readonly number[] = [1, 2, 3, 4, 5];

/** Short labels indexed by JS day-of-week (0=Sun..6=Sat). */
export const DAY_LABELS: readonly string[] = [
	'Sun',
	'Mon',
	'Tue',
	'Wed',
	'Thu',
	'Fri',
	'Sat',
];

export function effectiveWorkingDays(schedule: UserSchedule): number[] {
	if (schedule.workingDays && schedule.workingDays.length > 0) {
		return [...schedule.workingDays].sort((a, b) => a - b);
	}
	return [...DEFAULT_WORKING_DAYS];
}

/**
 * `isoDate` is YYYY-MM-DD interpreted in local time. Returns true when the
 * given date falls on one of the schedule's working days.
 */
export function isWorkingDay(schedule: UserSchedule, isoDate: string): boolean {
	const d = new Date(`${isoDate}T12:00:00`);
	if (Number.isNaN(d.getTime())) return false;
	return effectiveWorkingDays(schedule).includes(d.getDay());
}

/**
 * Produces a compact label for the working-days set:
 * - [1..5] → "Mon–Fri"
 * - [0..6] → "All days"
 * - [1,3,5] → "Mon, Wed, Fri"
 * - [6,0] (Sat+Sun) → "Sat, Sun"
 */
export function formatWorkingDays(schedule: UserSchedule): string {
	const days = effectiveWorkingDays(schedule);
	if (days.length === 0) return '-';
	if (days.length === 7) return 'All days';
	if (
		days.length === 5 &&
		days[0] === 1 &&
		days[1] === 2 &&
		days[2] === 3 &&
		days[3] === 4 &&
		days[4] === 5
	) {
		return 'Mon–Fri';
	}
	if (days.length === 6 && !days.includes(0)) return 'Mon–Sat';
	return days.map((d) => DAY_LABELS[d]).join(', ');
}
