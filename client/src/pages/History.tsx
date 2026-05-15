import {
	ArrowDownIcon,
	ArrowUpIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	LogInIcon,
	LogOutIcon,
	PencilIcon,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { RequestFixModal } from '@/components/RequestFixModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { fetchHistory } from '@/services/attendanceService';
import {
	type CreateEditRequestBody,
	createEditRequest,
} from '@/services/editRequestService';
import type { AttendanceRecord } from '@/types/api';
import { formatDate, formatHours, formatTimeOnly } from '@/utils/formatTime';

type AuditEvent = {
	id: string;
	kind: 'in' | 'out';
	iso: string;
	date: string;
	lateMinutes: number;
	missed: boolean;
	edited: boolean;
};

function buildAuditLog(records: AttendanceRecord[]): AuditEvent[] {
	const events: AuditEvent[] = [];
	for (const r of records) {
		const edited = Boolean(
			r.createdAt &&
				r.updatedAt &&
				new Date(r.updatedAt).getTime() - new Date(r.createdAt).getTime() >
					60_000,
		);
		events.push({
			id: `${r.id}:in`,
			kind: 'in',
			iso: r.timeIn,
			date: r.date,
			lateMinutes: r.computed?.lateMinutes ?? 0,
			missed: false,
			edited,
		});
		if (r.timeOut) {
			events.push({
				id: `${r.id}:out`,
				kind: 'out',
				iso: r.timeOut,
				date: r.date,
				lateMinutes: 0,
				missed: false,
				edited,
			});
		} else if (r.status !== 'active') {
			events.push({
				id: `${r.id}:miss`,
				kind: 'out',
				iso: r.timeIn,
				date: r.date,
				lateMinutes: 0,
				missed: true,
				edited,
			});
		}
	}
	return events;
}

type AuditKind = 'All' | 'Punch in' | 'Punch out';
type AuditStatus = 'Any' | 'On-time' | 'Late' | 'Missed' | 'Edited';
type SortDir = 'desc' | 'asc';
const AUDIT_KINDS: AuditKind[] = ['All', 'Punch in', 'Punch out'];
const AUDIT_STATUSES: AuditStatus[] = [
	'Any',
	'On-time',
	'Late',
	'Missed',
	'Edited',
];

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function isoDay(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

function startOfMonth(year: number, month: number): Date {
	return new Date(year, month, 1);
}

function endOfMonth(year: number, month: number): Date {
	return new Date(year, month + 1, 0);
}

type DayCell = {
	iso: string;
	day: number;
	inMonth: boolean;
	tone: 'ok' | 'late' | 'miss' | 'pto' | 'off' | null;
	record?: AttendanceRecord;
};

function classifyRecord(r: AttendanceRecord): DayCell['tone'] {
	if (!r) return null;
	const late = r.computed?.lateMinutes ?? 0;
	if (r.status === 'active') return 'ok';
	if (!r.timeOut) return 'miss';
	if (late > 0) return 'late';
	return 'ok';
}

function buildMonthGrid(
	year: number,
	month: number,
	records: AttendanceRecord[],
): DayCell[] {
	const first = startOfMonth(year, month);
	const last = endOfMonth(year, month);
	const recordsByDay = new Map<string, AttendanceRecord>();
	for (const r of records) {
		recordsByDay.set(r.date, r);
	}

	// Monday-first offset
	const firstWeekday = (first.getDay() + 6) % 7;
	const cells: DayCell[] = [];
	for (let i = 0; i < firstWeekday; i += 1) {
		const d = new Date(year, month, 1 - (firstWeekday - i));
		cells.push({
			iso: isoDay(d),
			day: d.getDate(),
			inMonth: false,
			tone: null,
		});
	}
	for (let d = 1; d <= last.getDate(); d += 1) {
		const date = new Date(year, month, d);
		const iso = isoDay(date);
		const r = recordsByDay.get(iso);
		const weekend = date.getDay() === 0 || date.getDay() === 6;
		cells.push({
			iso,
			day: d,
			inMonth: true,
			tone: r ? classifyRecord(r) : weekend ? 'off' : null,
			record: r,
		});
	}
	const trailing = (7 - (cells.length % 7)) % 7;
	for (let i = 1; i <= trailing; i += 1) {
		const d = new Date(year, month + 1, i);
		cells.push({
			iso: isoDay(d),
			day: d.getDate(),
			inMonth: false,
			tone: null,
		});
	}
	return cells;
}

const TONE_COLORS: Record<NonNullable<DayCell['tone']>, string> = {
	ok: 'bg-emerald-500',
	late: 'bg-amber-500',
	miss: 'bg-rose-500',
	pto: 'bg-muted-foreground',
	off: 'bg-muted',
};

export function History() {
	const { user } = useAuth();
	const { profile } = useProfile();
	const [searchParams, setSearchParams] = useSearchParams();
	const now = new Date();
	const initialIso = (() => {
		const param = searchParams.get('date');
		if (param && /^\d{4}-\d{2}-\d{2}$/.test(param)) return param;
		return isoDay(now);
	})();
	const initialDate = new Date(`${initialIso}T12:00:00`);
	const [viewYear, setViewYear] = useState(initialDate.getFullYear());
	const [viewMonth, setViewMonth] = useState(initialDate.getMonth());
	const [selectedIso, setSelectedIso] = useState(initialIso);

	useEffect(() => {
		const param = searchParams.get('date');
		if (!param || !/^\d{4}-\d{2}-\d{2}$/.test(param)) return;
		const d = new Date(`${param}T12:00:00`);
		if (Number.isNaN(d.getTime())) return;
		setSelectedIso(param);
		setViewYear(d.getFullYear());
		setViewMonth(d.getMonth());
		const next = new URLSearchParams(searchParams);
		next.delete('date');
		setSearchParams(next, { replace: true });
	}, [searchParams, setSearchParams]);
	const [records, setRecords] = useState<AttendanceRecord[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [auditKind, setAuditKind] = useState<AuditKind>('All');
	const [auditStatus, setAuditStatus] = useState<AuditStatus>('Any');
	const [auditSort, setAuditSort] = useState<SortDir>('desc');
	const [requestOpen, setRequestOpen] = useState(false);
	const [requestBusy, setRequestBusy] = useState(false);
	const [requestError, setRequestError] = useState<string | null>(null);

	const load = useCallback(
		async (signal?: AbortSignal) => {
			if (!user) return;
			const start = isoDay(startOfMonth(viewYear, viewMonth));
			const end = isoDay(endOfMonth(viewYear, viewMonth));
			setLoading(true);
			setError(null);
			try {
				const result = await fetchHistory(user, start, end, signal);
				setRecords(result.sessions);
			} catch (caught) {
				if ((caught as { name?: string })?.name === 'AbortError') return;
				setError(caught instanceof Error ? caught.message : 'Unknown error');
			} finally {
				setLoading(false);
			}
		},
		[user, viewYear, viewMonth],
	);

	useEffect(() => {
		const controller = new AbortController();
		void load(controller.signal);
		return () => controller.abort();
	}, [load]);

	const grid = useMemo(
		() => buildMonthGrid(viewYear, viewMonth, records),
		[viewYear, viewMonth, records],
	);

	const selectedCell = grid.find((c) => c.iso === selectedIso) ?? null;
	const monthLabel = new Intl.DateTimeFormat(undefined, {
		month: 'long',
		year: 'numeric',
	}).format(new Date(viewYear, viewMonth, 1));

	const auditEvents = useMemo(() => buildAuditLog(records), [records]);
	const dayAudit = useMemo(() => {
		const forDay = auditEvents.filter((e) => e.date === selectedIso);
		const byKind = forDay.filter((e) => {
			if (auditKind === 'Punch in') return e.kind === 'in';
			if (auditKind === 'Punch out') return e.kind === 'out';
			return true;
		});
		const byStatus = byKind.filter((e) => {
			if (auditStatus === 'Any') return true;
			if (auditStatus === 'Missed') return e.missed;
			if (auditStatus === 'Edited') return e.edited;
			if (auditStatus === 'Late') return e.kind === 'in' && e.lateMinutes > 0;
			if (auditStatus === 'On-time')
				return !e.missed && !(e.kind === 'in' && e.lateMinutes > 0);
			return true;
		});
		const sorted = [...byStatus].sort((a, b) => {
			const diff = new Date(a.iso).getTime() - new Date(b.iso).getTime();
			return auditSort === 'asc' ? diff : -diff;
		});
		return sorted;
	}, [auditEvents, selectedIso, auditKind, auditStatus, auditSort]);

	const counts = useMemo(() => {
		let ok = 0;
		let late = 0;
		let miss = 0;
		for (const c of grid) {
			if (!c.inMonth) continue;
			if (c.tone === 'ok') ok += 1;
			else if (c.tone === 'late') late += 1;
			else if (c.tone === 'miss') miss += 1;
		}
		return { ok, late, miss };
	}, [grid]);

	function goPrev() {
		if (viewMonth === 0) {
			setViewMonth(11);
			setViewYear(viewYear - 1);
		} else {
			setViewMonth(viewMonth - 1);
		}
	}

	function goNext() {
		if (viewMonth === 11) {
			setViewMonth(0);
			setViewYear(viewYear + 1);
		} else {
			setViewMonth(viewMonth + 1);
		}
	}

	function goToday() {
		const t = new Date();
		setViewYear(t.getFullYear());
		setViewMonth(t.getMonth());
		setSelectedIso(isoDay(t));
	}

	function openRequest() {
		if (!selectedCell?.record) return;
		setRequestError(null);
		setRequestOpen(true);
	}

	async function handleSubmitRequest(body: CreateEditRequestBody) {
		if (!user) return;
		setRequestBusy(true);
		setRequestError(null);
		try {
			await createEditRequest(user, body);
			setRequestOpen(false);
			toast.success('Request submitted. An admin will review it.');
			// Refresh the history so the "edited" badge updates after approval flows through.
			await load();
		} catch (caught) {
			setRequestError(
				caught instanceof Error ? caught.message : 'Unknown error',
			);
		} finally {
			setRequestBusy(false);
		}
	}

	return (
		<div className="flex flex-col gap-6 px-4 lg:px-6">
			<div className="flex flex-wrap items-end justify-between gap-3">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight">My history</h1>
					<p className="text-sm text-muted-foreground">
						All recorded punches · filter by date and review per-day detail
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button variant="outline" size="sm" onClick={goToday}>
						Today
					</Button>
				</div>
			</div>

			{error ? (
				<p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
					{error}
				</p>
			) : null}

			<div className="grid items-stretch gap-4 @4xl/main:grid-cols-[1.4fr_1fr]">
				<Card>
					<div className="flex items-center justify-between px-4">
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="icon-sm"
								onClick={goPrev}
								aria-label="Previous month"
							>
								<ChevronLeftIcon />
							</Button>
							<h2 className="text-base font-semibold">{monthLabel}</h2>
							<Button
								variant="outline"
								size="icon-sm"
								onClick={goNext}
								aria-label="Next month"
							>
								<ChevronRightIcon />
							</Button>
						</div>
						<div className="hidden items-center gap-3 text-xs text-muted-foreground @md/card:flex">
							<span className="flex items-center gap-1.5">
								<span className="inline-block size-2 rounded-sm bg-emerald-500" />
								On-time
							</span>
							<span className="flex items-center gap-1.5">
								<span className="inline-block size-2 rounded-sm bg-amber-500" />
								Late
							</span>
							<span className="flex items-center gap-1.5">
								<span className="inline-block size-2 rounded-sm bg-rose-500" />
								Missed
							</span>
						</div>
					</div>

					<div className="px-4 pb-4">
						<div className="grid grid-cols-7 gap-1 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
							{WEEKDAYS.map((d) => (
								<div key={d} className="px-1 py-1">
									{d}
								</div>
							))}
						</div>
						<div className="grid grid-cols-7 gap-1">
							{grid.map((c) => {
								const isSelected = c.iso === selectedIso;
								return (
									<button
										key={c.iso}
										type="button"
										onClick={() => setSelectedIso(c.iso)}
										className={cn(
											'flex aspect-square flex-col justify-between rounded-md border bg-card p-1.5 text-left transition-colors',
											'hover:border-primary/40',
											!c.inMonth && 'opacity-40',
											isSelected &&
												'border-primary bg-primary/10 ring-1 ring-primary',
										)}
									>
										<span className="font-mono text-xs tabular-nums">
											{c.day}
										</span>
										{c.tone ? (
											<span
												className={cn(
													'size-1.5 self-end rounded-sm',
													TONE_COLORS[c.tone],
												)}
											/>
										) : null}
									</button>
								);
							})}
						</div>

						<Separator className="my-3" />
						<div className="flex flex-wrap gap-2 text-xs">
							<Badge variant="outline">{records.length} sessions</Badge>
							<Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-400">
								{counts.ok} on-time
							</Badge>
							<Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/15 dark:text-amber-400">
								{counts.late} late
							</Badge>
							<Badge variant="destructive">{counts.miss} missed</Badge>
						</div>
					</div>
				</Card>

				<Card className="h-full max-h-[80vh] gap-0 overflow-hidden p-0">
					<div className="flex items-center justify-between border-b px-4 py-3">
						<div>
							<h2 className="text-base font-semibold">
								{selectedCell ? formatDate(selectedCell.iso) : 'Select a day'}
							</h2>
							{selectedCell?.record ? (
								<p className="font-mono text-xs text-muted-foreground">
									{formatTimeOnly(
										selectedCell.record.timeIn,
										profile?.timezone,
									)}
									{' → '}
									{selectedCell.record.timeOut
										? formatTimeOnly(
												selectedCell.record.timeOut,
												profile?.timezone,
											)
										: 'live'}
								</p>
							) : null}
						</div>
						{selectedCell?.record ? (
							selectedCell.record.status === 'active' ? (
								<Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-400">
									● on shift
								</Badge>
							) : (
								<Badge variant="secondary">completed</Badge>
							)
						) : null}
					</div>

					<div className="flex flex-col gap-2 px-4 py-3">
						{selectedCell?.record ? (
							<div className="grid grid-cols-2 gap-3">
								<div className="flex flex-col gap-0.5 rounded-md border bg-muted/30 p-3">
									<span className="text-[10px] uppercase tracking-wider text-muted-foreground">
										Regular
									</span>
									<span className="font-mono text-base font-semibold">
										{formatHours(
											selectedCell.record.computed?.regularHours ?? 0,
										)}
										h
									</span>
								</div>
								<div className="flex flex-col gap-0.5 rounded-md border bg-muted/30 p-3">
									<span className="text-[10px] uppercase tracking-wider text-muted-foreground">
										Overtime
									</span>
									<span className="font-mono text-base font-semibold">
										{formatHours(
											selectedCell.record.computed?.overtimeHours ?? 0,
										)}
										h
									</span>
								</div>
								<div className="flex flex-col gap-0.5 rounded-md border bg-muted/30 p-3">
									<span className="text-[10px] uppercase tracking-wider text-muted-foreground">
										Late
									</span>
									<span className="font-mono text-base font-semibold">
										{selectedCell.record.computed?.lateMinutes ?? 0}m
									</span>
								</div>
								<div className="flex flex-col gap-0.5 rounded-md border bg-muted/30 p-3">
									<span className="text-[10px] uppercase tracking-wider text-muted-foreground">
										Night diff.
									</span>
									<span className="font-mono text-base font-semibold">
										{formatHours(
											selectedCell.record.computed?.nightDifferentialHours ?? 0,
										)}
										h
									</span>
								</div>
							</div>
						) : (
							<p className="text-sm text-muted-foreground">
								{loading
									? 'Loading…'
									: 'No punch recorded on this day. Tap another date or request an amendment.'}
							</p>
						)}
					</div>

					{/* Audit log */}
					<div className="mt-2 flex min-h-0 flex-1 flex-col border-t">
						<div className="flex flex-wrap items-center gap-2 border-b bg-muted/20 px-4 py-2">
							<h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
								Audit log
							</h3>
							<Badge variant="outline" className="text-[10px]">
								{dayAudit.length}
							</Badge>
							<div className="ml-auto flex items-center gap-1">
								<Button
									variant="outline"
									size="xs"
									onClick={() =>
										setAuditSort(auditSort === 'desc' ? 'asc' : 'desc')
									}
									aria-label="Toggle sort direction"
								>
									{auditSort === 'desc' ? (
										<>
											<ArrowDownIcon />
											Newest
										</>
									) : (
										<>
											<ArrowUpIcon />
											Oldest
										</>
									)}
								</Button>
							</div>
						</div>
						<div className="flex flex-wrap items-center gap-1.5 border-b px-4 py-2">
							{AUDIT_KINDS.map((k) => (
								<button
									key={k}
									type="button"
									onClick={() => setAuditKind(k)}
									className={cn(
										'rounded border px-2 py-0.5 text-[11px]',
										auditKind === k
											? 'border-foreground bg-foreground text-background'
											: 'border-border bg-background hover:bg-muted',
									)}
								>
									{k}
								</button>
							))}
							<span className="mx-1 h-3 w-px bg-border" />
							{AUDIT_STATUSES.map((s) => (
								<button
									key={s}
									type="button"
									onClick={() => setAuditStatus(s)}
									className={cn(
										'rounded border px-2 py-0.5 text-[11px]',
										auditStatus === s
											? 'border-primary bg-primary/10 text-primary'
											: 'border-border bg-background hover:bg-muted',
									)}
								>
									{s}
								</button>
							))}
						</div>
						<div className="min-h-0 flex-1 overflow-y-auto">
							{dayAudit.length === 0 ? (
								<div className="px-4 py-8 text-center text-xs text-muted-foreground">
									No matching punch events for this day.
								</div>
							) : (
								<ol className="flex flex-col">
									{dayAudit.map((e, i) => (
										<li
											key={e.id}
											className={cn(
												'grid grid-cols-[64px_24px_1fr_auto] items-center gap-2.5 px-4 py-2',
												i < dayAudit.length - 1 && 'border-b',
											)}
										>
											<span className="font-mono text-xs font-semibold tabular-nums">
												{formatTimeOnly(e.iso, profile?.timezone)}
											</span>
											<div
												className={cn(
													'flex size-6 items-center justify-center rounded-full',
													e.kind === 'in'
														? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
														: e.missed
															? 'bg-rose-500/15 text-rose-700 dark:text-rose-400'
															: 'bg-zinc-500/15 text-zinc-700 dark:text-zinc-300',
												)}
											>
												{e.kind === 'in' ? (
													<LogInIcon className="size-3" />
												) : (
													<LogOutIcon className="size-3" />
												)}
											</div>
											<span className="truncate text-xs font-medium">
												{e.missed
													? 'Missed punch out'
													: e.kind === 'in'
														? 'Punch in'
														: 'Punch out'}
											</span>
											<div className="flex items-center gap-1">
												{e.missed ? (
													<Badge variant="destructive" className="text-[10px]">
														missed
													</Badge>
												) : e.kind === 'in' && e.lateMinutes > 0 ? (
													<Badge className="bg-amber-500/15 text-[10px] text-amber-700 hover:bg-amber-500/15 dark:text-amber-400">
														late {e.lateMinutes}m
													</Badge>
												) : (
													<Badge
														variant="outline"
														className="text-[10px] text-muted-foreground"
													>
														on-time
													</Badge>
												)}
												{e.edited ? (
													<Badge
														variant="outline"
														className="border-primary/40 text-[10px] text-primary"
													>
														edited
													</Badge>
												) : null}
											</div>
										</li>
									))}
								</ol>
							)}
						</div>
					</div>

					<div className="flex gap-2 border-t bg-muted/30 px-4 py-3">
						<Button
							variant="outline"
							className="flex-1"
							onClick={openRequest}
							disabled={!selectedCell?.record}
						>
							<PencilIcon />
							Request fix
						</Button>
					</div>
				</Card>
			</div>

			<RequestFixModal
				open={requestOpen}
				record={selectedCell?.record ?? null}
				employeeName={profile?.name}
				timezone={profile?.timezone}
				busy={requestBusy}
				error={requestError}
				onOpenChange={(open) => {
					setRequestOpen(open);
					if (!open) setRequestError(null);
				}}
				onSubmit={(body) => void handleSubmitRequest(body)}
			/>
		</div>
	);
}
