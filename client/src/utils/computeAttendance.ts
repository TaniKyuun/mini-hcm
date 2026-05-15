/**
 * Client-side port of `server/src/services/computeService.ts`.
 *
 * Server is the source of truth — on punch-out it runs `computeHours` and writes
 * the result into `attendance.computed`, then sums all completed sessions for
 * the day into `dailySummary`. The dashboard reads that summary, so an open /
 * active session contributes nothing until it's closed.
 *
 * To keep the Today card honest while a user is still on the clock, we re-run
 * the same algorithm here against (timeIn → now) and add the result on top of
 * the static summary the server returned.
 *
 * Schema reminder:
 *   attendance.timeIn  | Firestore Timestamp → ISO string on the wire
 *   computed.*Hours    | decimal hours (e.g. 5.30 == 5h 18m)
 *   computed.*Minutes  | integer minutes
 */

import type { ComputedAttendance, UserSchedule } from '@/types/api';

const NIGHT_DIFFERENTIAL_START = '22:00';
const NIGHT_DIFFERENTIAL_END = '06:00';

export function emptyComputed(): ComputedAttendance {
	return {
		regularHours: 0,
		overtimeHours: 0,
		nightDifferentialHours: 0,
		lateMinutes: 0,
		undertimeMinutes: 0,
	};
}

export function computeHours(
	timeIn: Date,
	timeOut: Date,
	schedule: UserSchedule,
	timezone: string,
): ComputedAttendance {
	const timeInMs = timeIn.getTime();
	const timeOutMs = timeOut.getTime();
	if (timeOutMs <= timeInMs) return emptyComputed();

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
		regularHours: regularMs / 3_600_000,
		overtimeHours: overtimeMs / 3_600_000,
		nightDifferentialHours: nightDifferentialMs / 3_600_000,
		lateMinutes,
		undertimeMinutes,
	};
}

export function addComputed(
	a: ComputedAttendance,
	b: ComputedAttendance,
): ComputedAttendance {
	return {
		regularHours: a.regularHours + b.regularHours,
		overtimeHours: a.overtimeHours + b.overtimeHours,
		nightDifferentialHours: a.nightDifferentialHours + b.nightDifferentialHours,
		lateMinutes: a.lateMinutes + b.lateMinutes,
		undertimeMinutes: a.undertimeMinutes + b.undertimeMinutes,
	};
}

/** Scheduled shift length in hours, used for the "of Xh goal" hint. */
export function scheduledShiftHours(schedule: UserSchedule): number {
	const start = parseHm(schedule.start);
	const end = parseHm(schedule.end);
	const minutes = end > start ? end - start : end + 24 * 60 - start;
	return minutes / 60;
}

function parseHm(value: string): number {
	const [hStr = '0', mStr = '0'] = value.split(':');
	const h = parseInt(hStr, 10) || 0;
	const m = parseInt(mStr, 10) || 0;
	return h * 60 + m;
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

/** Format `date` as `YYYY-MM-DD` interpreted in `timezone`. */
function localDateString(date: Date, timezone: string): string {
	const parts = new Intl.DateTimeFormat('en-CA', {
		timeZone: timezone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).formatToParts(date);
	const get = (type: Intl.DateTimeFormatPartTypes) =>
		parts.find((p) => p.type === type)?.value ?? '';
	return `${get('year')}-${get('month')}-${get('day')}`;
}

/** Interpret wall-clock `YYYY-MM-DD HH:mm` in `timezone` as a UTC Date. */
function localToUtc(
	localDate: string,
	localTime: string,
	timezone: string,
): Date {
	const naiveUtc = new Date(`${localDate}T${localTime}:00Z`);
	const localized = new Date(
		naiveUtc.toLocaleString('en-US', { timeZone: timezone }),
	);
	const utc = new Date(naiveUtc.toLocaleString('en-US', { timeZone: 'UTC' }));
	const offsetMs = utc.getTime() - localized.getTime();
	return new Date(naiveUtc.getTime() + offsetMs);
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
