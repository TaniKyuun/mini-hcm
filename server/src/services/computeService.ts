import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import type { ComputedAttendance, UserSchedule } from '../types/models.js';

export type ComputeHoursInput = {
	timeIn: Date;
	timeOut: Date;
	schedule: UserSchedule;
	timezone: string;
};

const NIGHT_DIFFERENTIAL_START = '22:00';
const NIGHT_DIFFERENTIAL_END = '06:00';

export function computeHours(input: ComputeHoursInput): ComputedAttendance {
	const { timeIn, timeOut, schedule, timezone } = input;
	const timeInMs = timeIn.getTime();
	const timeOutMs = timeOut.getTime();

	if (timeOutMs <= timeInMs) {
		return zeroComputed();
	}

	const baseDate = localDateString(timeIn, timezone);
	const scheduledStartMs = localToUtc(
		baseDate,
		schedule.start,
		timezone,
	).getTime();
	const scheduledEndDate =
		schedule.end <= schedule.start ? addDays(baseDate, 1) : baseDate;
	const scheduledEndMs = localToUtc(
		scheduledEndDate,
		schedule.end,
		timezone,
	).getTime();

	const lateMinutes = Math.max(
		0,
		Math.round((timeInMs - scheduledStartMs) / 60_000),
	);
	const undertimeMinutes = Math.max(
		0,
		Math.round((scheduledEndMs - timeOutMs) / 60_000),
	);

	const regularMs = intervalIntersection(
		timeInMs,
		timeOutMs,
		scheduledStartMs,
		scheduledEndMs,
	);
	const overtimeMs = Math.max(
		0,
		timeOutMs - Math.max(scheduledEndMs, timeInMs),
	);
	const nightDifferentialMs = computeNightDifferentialMs(
		timeInMs,
		timeOutMs,
		timezone,
	);

	return {
		regularHours: round2(regularMs / 3_600_000),
		overtimeHours: round2(overtimeMs / 3_600_000),
		nightDifferentialHours: round2(nightDifferentialMs / 3_600_000),
		lateMinutes,
		undertimeMinutes,
	};
}

function computeNightDifferentialMs(
	timeInMs: number,
	timeOutMs: number,
	timezone: string,
): number {
	const startDate = localDateString(new Date(timeInMs), timezone);
	const endDate = localDateString(new Date(timeOutMs), timezone);

	let total = 0;
	let cursor = addDays(startDate, -1);

	while (cursor <= endDate) {
		const nightStart = localToUtc(
			cursor,
			NIGHT_DIFFERENTIAL_START,
			timezone,
		).getTime();
		const nightEnd = localToUtc(
			addDays(cursor, 1),
			NIGHT_DIFFERENTIAL_END,
			timezone,
		).getTime();
		total += intervalIntersection(timeInMs, timeOutMs, nightStart, nightEnd);
		cursor = addDays(cursor, 1);
	}

	return total;
}

function localToUtc(
	localDate: string,
	localTime: string,
	timezone: string,
): Date {
	return fromZonedTime(`${localDate}T${localTime}:00`, timezone);
}

function localDateString(date: Date, timezone: string): string {
	return formatInTimeZone(date, timezone, 'yyyy-MM-dd');
}

function addDays(dateStr: string, days: number): string {
	const d = new Date(`${dateStr}T12:00:00Z`);
	d.setUTCDate(d.getUTCDate() + days);
	return d.toISOString().slice(0, 10);
}

function intervalIntersection(
	aStart: number,
	aEnd: number,
	bStart: number,
	bEnd: number,
): number {
	const start = Math.max(aStart, bStart);
	const end = Math.min(aEnd, bEnd);
	return Math.max(0, end - start);
}

function round2(value: number): number {
	return Math.round(value * 100) / 100;
}

function zeroComputed(): ComputedAttendance {
	return {
		regularHours: 0,
		overtimeHours: 0,
		nightDifferentialHours: 0,
		lateMinutes: 0,
		undertimeMinutes: 0,
	};
}
