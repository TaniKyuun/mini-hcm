const ISO_DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export function isoToDate(iso: string | null): Date | undefined {
	if (!iso) return undefined;
	const raw = ISO_DATE_ONLY.test(iso) ? `${iso}T12:00:00` : iso;
	const d = new Date(raw);
	return Number.isNaN(d.getTime()) ? undefined : d;
}

export function dateToIso(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

export function addDaysIso(iso: string, days: number): string {
	const d = isoToDate(iso);
	if (!d) return iso;
	d.setDate(d.getDate() + days);
	return dateToIso(d);
}

export function startOfWeekIso(d: Date = new Date()): string {
	const date = new Date(d);
	const day = (date.getDay() + 6) % 7;
	date.setDate(date.getDate() - day);
	return dateToIso(date);
}
