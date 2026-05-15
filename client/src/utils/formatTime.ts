export function formatDuration(milliseconds: number): string {
	if (milliseconds <= 0) return '0h 00m';
	const totalMinutes = Math.floor(milliseconds / 60_000);
	const hours = Math.floor(totalMinutes / 60);
	const minutes = totalMinutes % 60;
	return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
}

/** Live ticker format: "Hh MMm SSs" - drops the hours segment when zero. */
export function formatDurationWithSeconds(milliseconds: number): string {
	if (!Number.isFinite(milliseconds) || milliseconds <= 0) return '0s';
	const totalSeconds = Math.floor(milliseconds / 1000);
	const h = Math.floor(totalSeconds / 3600);
	const m = Math.floor((totalSeconds % 3600) / 60);
	const s = totalSeconds % 60;
	const pad = (n: number) => n.toString().padStart(2, '0');
	if (h > 0) return `${h}h ${pad(m)}m ${pad(s)}s`;
	if (m > 0) return `${m}m ${pad(s)}s`;
	return `${s}s`;
}

export function formatHours(hours: number): string {
	if (!Number.isFinite(hours) || hours <= 0) return '0.00';
	return hours.toFixed(2);
}

export function formatHoursAndMinutes(hours: number): string {
	if (!Number.isFinite(hours) || hours <= 0) return '0h 00m';
	const totalMinutes = Math.round(hours * 60);
	const h = Math.floor(totalMinutes / 60);
	const m = totalMinutes % 60;
	return `${h}h ${m.toString().padStart(2, '0')}m`;
}

export function formatMinutes(minutes: number): string {
	if (!Number.isFinite(minutes) || minutes <= 0) return '0m';
	if (minutes < 60) return `${Math.round(minutes)}m`;
	const h = Math.floor(minutes / 60);
	const m = Math.round(minutes % 60);
	return `${h}h ${m.toString().padStart(2, '0')}m`;
}

export function formatDateTime(iso: string | null, timezone?: string): string {
	if (!iso) return '-';
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return '-';
	return new Intl.DateTimeFormat(undefined, {
		dateStyle: 'medium',
		timeStyle: 'short',
		timeZone: timezone,
	}).format(date);
}

export function formatTimeOnly(iso: string | null, timezone?: string): string {
	if (!iso) return '-';
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return '-';
	return new Intl.DateTimeFormat(undefined, {
		timeStyle: 'short',
		timeZone: timezone,
	}).format(date);
}

export function formatDate(value: string | null): string {
	if (!value) return '-';
	const date = new Date(`${value}T12:00:00Z`);
	if (Number.isNaN(date.getTime())) return value;
	return new Intl.DateTimeFormat(undefined, {
		dateStyle: 'medium',
	}).format(date);
}
