export function formatDuration(milliseconds: number): string {
	if (milliseconds <= 0) return '0h 00m';
	const totalMinutes = Math.floor(milliseconds / 60_000);
	const hours = Math.floor(totalMinutes / 60);
	const minutes = totalMinutes % 60;
	return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
}

export function formatHours(hours: number): string {
	if (!Number.isFinite(hours) || hours <= 0) return '0.00';
	return hours.toFixed(2);
}

export function formatDateTime(iso: string | null, timezone?: string): string {
	if (!iso) return '—';
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return '—';
	return new Intl.DateTimeFormat(undefined, {
		dateStyle: 'medium',
		timeStyle: 'short',
		timeZone: timezone,
	}).format(date);
}

export function formatTimeOnly(iso: string | null, timezone?: string): string {
	if (!iso) return '—';
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return '—';
	return new Intl.DateTimeFormat(undefined, {
		timeStyle: 'short',
		timeZone: timezone,
	}).format(date);
}

export function formatDate(value: string | null): string {
	if (!value) return '—';
	const date = new Date(`${value}T12:00:00Z`);
	if (Number.isNaN(date.getTime())) return value;
	return new Intl.DateTimeFormat(undefined, {
		dateStyle: 'medium',
	}).format(date);
}
