import type { UserSchedule } from '../types/models';

/** Mon (1) through Fri (5). */
export const DEFAULT_WORKING_DAYS: readonly number[] = [1, 2, 3, 4, 5];

export function effectiveWorkingDays(schedule: UserSchedule): number[] {
	if (schedule.workingDays && schedule.workingDays.length > 0) {
		return [...schedule.workingDays].sort((a, b) => a - b);
	}
	return [...DEFAULT_WORKING_DAYS];
}

/**
 * `isoDate` is YYYY-MM-DD in the employee's local timezone. Parsing as
 * local time (no Z suffix) gives the correct day-of-week.
 */
export function isWorkingDay(schedule: UserSchedule, isoDate: string): boolean {
	const d = new Date(`${isoDate}T12:00:00`);
	if (Number.isNaN(d.getTime())) return false;
	return effectiveWorkingDays(schedule).includes(d.getDay());
}
