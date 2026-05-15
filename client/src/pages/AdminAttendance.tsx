import {
	CalendarIcon,
	ChevronDownIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	PencilIcon,
	XIcon,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { EditPunchModal } from '@/components/EditPunchModal';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import {
	adminUpdateAttendance,
	fetchAdminAttendanceByDate,
	fetchEmployees,
} from '@/services/adminService';
import type { AttendanceRecord, UserProfile } from '@/types/api';
import { addDaysIso, dateToIso, isoToDate } from '@/utils/dateIso';
import { decorateEmployee, initialsOf } from '@/utils/employeeMock';
import {
	formatHoursAndMinutes,
	formatMinutes,
	formatTimeOnly,
} from '@/utils/formatTime';
import { isWorkingDay } from '@/utils/workingDays';

type Filter =
	| 'All'
	| 'On shift'
	| 'Late'
	| 'Absent'
	| 'Completed'
	| 'Rest day';
const FILTERS: Filter[] = [
	'All',
	'On shift',
	'Late',
	'Absent',
	'Completed',
	'Rest day',
];

const DAY_START_HOUR = 6;
const DAY_END_HOUR = 22;

function todayIso(): string {
	return dateToIso(new Date());
}

function formatViewedDate(iso: string): string {
	if (iso === todayIso()) return 'Today';
	const d = isoToDate(iso);
	if (!d) return iso;
	return new Intl.DateTimeFormat(undefined, {
		weekday: 'short',
		month: 'short',
		day: 'numeric',
	}).format(d);
}

function minutesSinceMidnight(date: Date): number {
	return date.getHours() * 60 + date.getMinutes();
}

function parseScheduleTime(value: string): number {
	const [h, m] = value.split(':').map((p) => parseInt(p, 10));
	if (Number.isNaN(h)) return DAY_START_HOUR * 60;
	return h * 60 + (Number.isNaN(m) ? 0 : m);
}

function pctOfDay(minutes: number): number {
	const span = (DAY_END_HOUR - DAY_START_HOUR) * 60;
	return Math.max(
		0,
		Math.min(100, ((minutes - DAY_START_HOUR * 60) / span) * 100),
	);
}

type RowState = 'on-shift' | 'late' | 'completed' | 'absent' | 'rest-day';

function classifyRow(
	session: AttendanceRecord | null,
	isRestDay: boolean,
): RowState {
	if (!session) return isRestDay ? 'rest-day' : 'absent';
	if (session.status === 'active') {
		if ((session.computed?.lateMinutes ?? 0) > 0) return 'late';
		return 'on-shift';
	}
	if ((session.computed?.lateMinutes ?? 0) > 0) return 'late';
	return 'completed';
}

function StateBadge({ state }: { state: RowState }) {
	if (state === 'on-shift') {
		return (
			<Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-400">
				● on shift
			</Badge>
		);
	}
	if (state === 'late') {
		return (
			<Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/15 dark:text-amber-400">
				late
			</Badge>
		);
	}
	if (state === 'absent') return <Badge variant="destructive">absent</Badge>;
	if (state === 'rest-day') return <Badge variant="outline">rest day</Badge>;
	return <Badge variant="secondary">completed</Badge>;
}

export function AdminAttendance() {
	const { user } = useAuth();
	const [searchParams] = useSearchParams();
	const requestedUid = searchParams.get('uid');
	const [employees, setEmployees] = useState<UserProfile[]>([]);
	const [sessions, setSessions] = useState<
		Record<string, AttendanceRecord | null>
	>({});
	const [search, setSearch] = useState('');
	const [filter, setFilter] = useState<Filter>('All');
	const [selectedUid, setSelectedUid] = useState<string | null>(requestedUid);
	const [error, setError] = useState<string | null>(null);
	const [date, setDate] = useState(todayIso());
	const [datePickerOpen, setDatePickerOpen] = useState(false);
	const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(
		null,
	);
	const [editBusy, setEditBusy] = useState(false);
	const [editError, setEditError] = useState<string | null>(null);

	const load = useCallback(async () => {
		if (!user) return;
		try {
			// Single bulk query for all employees' sessions on this date instead of
			// one fetch per employee. The map below picks the most recent session
			// per user (latest timeIn) which is what the roster row shows.
			const [emp, byDate] = await Promise.all([
				fetchEmployees(user),
				fetchAdminAttendanceByDate(user, date),
			]);
			setEmployees(emp.employees);

			const latestByUid = new Map<string, AttendanceRecord>();
			for (const session of byDate.sessions) {
				const existing = latestByUid.get(session.userId);
				if (
					!existing ||
					new Date(session.timeIn).getTime() >
						new Date(existing.timeIn).getTime()
				) {
					latestByUid.set(session.userId, session);
				}
			}
			const map: Record<string, AttendanceRecord | null> = {};
			for (const e of emp.employees) {
				map[e.uid] = latestByUid.get(e.uid) ?? null;
			}
			setSessions(map);
			if (!selectedUid && emp.employees.length > 0) {
				setSelectedUid(emp.employees[0].uid);
			}
		} catch (caught) {
			setError(caught instanceof Error ? caught.message : 'Unknown error');
		}
	}, [user, date, selectedUid]);

	useEffect(() => {
		void load();
	}, [load]);

	function openEdit(record: AttendanceRecord) {
		setEditError(null);
		setEditingRecord(record);
	}

	async function handleSaveEdit(body: {
		timeIn?: string;
		timeOut?: string | null;
		reason?: string;
		notify?: boolean;
	}) {
		if (!user || !editingRecord) return;
		setEditBusy(true);
		setEditError(null);
		try {
			await adminUpdateAttendance(user, editingRecord.id, {
				timeIn: body.timeIn,
				timeOut: body.timeOut,
				reason: body.reason,
				notify: body.notify,
			});
			setEditingRecord(null);
			await load();
		} catch (caught) {
			setEditError(caught instanceof Error ? caught.message : 'Unknown error');
		} finally {
			setEditBusy(false);
		}
	}

	const decorated = useMemo(
		() =>
			employees.map((emp) => {
				const session = sessions[emp.uid] ?? null;
				const restDay = !isWorkingDay(emp.schedule, date);
				return {
					profile: emp,
					deco: decorateEmployee(emp),
					session,
					state: classifyRow(session, restDay),
				};
			}),
		[employees, sessions, date],
	);

	const filtered = useMemo(() => {
		const term = search.trim().toLowerCase();
		return decorated.filter((row) => {
			if (filter === 'On shift' && row.state !== 'on-shift') return false;
			if (filter === 'Late' && row.state !== 'late') return false;
			if (filter === 'Absent' && row.state !== 'absent') return false;
			if (filter === 'Completed' && row.state !== 'completed') return false;
			if (filter === 'Rest day' && row.state !== 'rest-day') return false;
			if (!term) return true;
			return (
				row.profile.name.toLowerCase().includes(term) ||
				row.profile.email.toLowerCase().includes(term)
			);
		});
	}, [decorated, filter, search]);

	const counts = useMemo(() => {
		const c = {
			onShift: 0,
			late: 0,
			absent: 0,
			completed: 0,
			restDay: 0,
		};
		for (const row of decorated) {
			if (row.state === 'on-shift') c.onShift += 1;
			else if (row.state === 'late') c.late += 1;
			else if (row.state === 'absent') c.absent += 1;
			else if (row.state === 'completed') c.completed += 1;
			else if (row.state === 'rest-day') c.restDay += 1;
		}
		return c;
	}, [decorated]);

	const selected = decorated.find((r) => r.profile.uid === selectedUid) ?? null;

	const timeline = useMemo(() => {
		if (!selected) return null;
		const shiftStart = parseScheduleTime(selected.profile.schedule.start);
		const shiftEnd = parseScheduleTime(selected.profile.schedule.end);
		const actualIn = selected.session
			? minutesSinceMidnight(new Date(selected.session.timeIn))
			: null;
		const actualOut = selected.session?.timeOut
			? minutesSinceMidnight(new Date(selected.session.timeOut))
			: null;
		const now = minutesSinceMidnight(new Date());
		const isActive = selected.session?.status === 'active';
		return {
			shiftStartPct: pctOfDay(shiftStart),
			shiftEndPct: pctOfDay(shiftEnd),
			actualInPct: actualIn !== null ? pctOfDay(actualIn) : null,
			actualEndPct: pctOfDay(actualOut ?? (isActive ? now : (actualIn ?? 0))),
			isActive,
			shiftStartLabel: selected.profile.schedule.start,
			shiftEndLabel: selected.profile.schedule.end,
			actualInLabel: selected.session
				? formatTimeOnly(selected.session.timeIn, selected.profile.timezone)
				: null,
			actualOutLabel: selected.session?.timeOut
				? formatTimeOnly(selected.session.timeOut, selected.profile.timezone)
				: isActive
					? 'now'
					: null,
		};
	}, [selected]);

	return (
		<div className="flex min-h-0 flex-1 flex-col gap-4 px-4 lg:px-6">
			<div className="flex flex-wrap items-end justify-between gap-3">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight">
						Attendance · {formatViewedDate(date)}
					</h1>
					<p className="text-sm text-muted-foreground">
						Browse left · inspect &amp; edit right · {employees.length} people
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-400">
						{counts.onShift} on shift
					</Badge>
					<Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/15 dark:text-amber-400">
						{counts.late} late
					</Badge>
					<Badge variant="destructive">{counts.absent} absent</Badge>
					{counts.restDay > 0 ? (
						<Badge variant="outline">{counts.restDay} rest day</Badge>
					) : null}
					<div className="ml-1 flex items-center gap-1">
						<Button
							variant="ghost"
							size="icon-sm"
							onClick={() => setDate(addDaysIso(date, -1))}
							aria-label="Previous day"
						>
							<ChevronLeftIcon />
						</Button>
						<Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
							<PopoverTrigger
								render={
									<Button
										variant="outline"
										size="sm"
										className="justify-between font-normal"
									/>
								}
							>
								<CalendarIcon />
								{formatViewedDate(date)}
								<ChevronDownIcon />
							</PopoverTrigger>
							<PopoverContent
								className="w-auto overflow-hidden p-0"
								align="end"
							>
								<Calendar
									mode="single"
									selected={isoToDate(date)}
									defaultMonth={isoToDate(date)}
									onSelect={(d) => {
										if (d) setDate(dateToIso(d));
										setDatePickerOpen(false);
									}}
								/>
							</PopoverContent>
						</Popover>
						<Button
							variant="ghost"
							size="icon-sm"
							onClick={() => setDate(addDaysIso(date, 1))}
							aria-label="Next day"
						>
							<ChevronRightIcon />
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setDate(todayIso())}
							disabled={date === todayIso()}
						>
							Today
						</Button>
					</div>
				</div>
			</div>

			{error ? (
				<p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
					{error}
				</p>
			) : null}

			<div className="grid min-h-0 flex-1 gap-4 @4xl/main:grid-cols-[1.1fr_1fr]">
				{/* LEFT - list */}
				<Card className="gap-0 overflow-hidden p-0">
					<div className="flex items-center gap-2 border-b px-3 py-2">
						<Input
							type="search"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder={`Search · ${employees.length} people`}
							className="flex-1"
						/>
						<Button
							variant="outline"
							size="icon-sm"
							aria-label="Clear search"
							onClick={() => setSearch('')}
							disabled={search.length === 0}
						>
							<XIcon />
						</Button>
					</div>
					<div className="flex items-center gap-1.5 border-b bg-muted/30 px-3 py-2">
						{FILTERS.map((f) => (
							<button
								key={f}
								type="button"
								onClick={() => setFilter(f)}
								className={cn(
									'rounded border px-2.5 py-1 text-xs',
									filter === f
										? 'border-foreground bg-foreground text-background'
										: 'border-border bg-background hover:bg-muted',
								)}
							>
								{f}
							</button>
						))}
					</div>
					<div className="flex-1 overflow-y-auto">
						{filtered.length === 0 ? (
							<div className="px-4 py-12 text-center text-sm text-muted-foreground">
								No employees match.
							</div>
						) : (
							filtered.map(({ profile, session, state }) => {
								const isSel = profile.uid === selectedUid;
								return (
									<button
										key={profile.uid}
										type="button"
										onClick={() => setSelectedUid(profile.uid)}
										className={cn(
											'flex w-full items-center gap-3 border-b border-l-[3px] border-l-transparent px-3 py-2.5 text-left transition-colors hover:bg-muted/40',
											isSel && 'border-l-primary bg-primary/10',
										)}
									>
										<Avatar className="size-8">
											<AvatarFallback className="text-xs">
												{initialsOf(profile.name)}
											</AvatarFallback>
										</Avatar>
										<div className="min-w-0 flex-1">
											<div
												className={cn(
													'truncate text-sm',
													isSel ? 'font-semibold' : 'font-medium',
												)}
											>
												{profile.name}
											</div>
											<div className="truncate text-xs text-muted-foreground">
												{profile.schedule.start}–{profile.schedule.end}
											</div>
										</div>
										<div className="text-right">
											<div className="font-mono text-xs tabular-nums text-muted-foreground">
												{session
													? `${formatTimeOnly(session.timeIn, profile.timezone)} → ${session.timeOut ? formatTimeOnly(session.timeOut, profile.timezone) : 'live'}`
													: '- → -'}
											</div>
											<div className="mt-1">
												<StateBadge state={state} />
											</div>
										</div>
									</button>
								);
							})
						)}
					</div>
				</Card>

				{/* RIGHT - detail */}
				<Card className="gap-0 overflow-hidden p-0">
					{selected ? (
						<>
							<div className="flex items-center gap-3 border-b px-4 py-4">
								<Avatar className="size-12 rounded-lg bg-foreground text-background">
									<AvatarFallback className="rounded-lg bg-foreground font-semibold text-background">
										{initialsOf(selected.profile.name)}
									</AvatarFallback>
								</Avatar>
								<div className="flex-1">
									<div className="text-lg font-semibold tracking-tight">
										{selected.profile.name}
									</div>
									<div className="text-xs text-muted-foreground">
										Shift {selected.profile.schedule.start}–
										{selected.profile.schedule.end} ·{' '}
										{selected.profile.location ?? selected.deco.location} · ID{' '}
										{selected.profile.uid}
									</div>
								</div>
								<StateBadge state={selected.state} />
							</div>

							{/* Timeline */}
							{timeline ? (
								<div className="border-b px-4 py-4">
									<div className="mb-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
										Today's timeline · {DAY_START_HOUR}:00 → {DAY_END_HOUR}:00
									</div>
									<div className="relative h-8 rounded border bg-muted/30">
										{/* shift expectation */}
										<div
											className="absolute inset-y-0 bg-foreground/10"
											style={{
												left: `${timeline.shiftStartPct}%`,
												width: `${Math.max(0, timeline.shiftEndPct - timeline.shiftStartPct)}%`,
											}}
										/>
										{/* actual */}
										{timeline.actualInPct !== null ? (
											<div
												className="absolute inset-y-0 bg-emerald-500/50"
												style={{
													left: `${timeline.actualInPct}%`,
													width: `${Math.max(0, timeline.actualEndPct - timeline.actualInPct)}%`,
												}}
											/>
										) : null}
										{/* in marker */}
										{timeline.actualInPct !== null ? (
											<div
												className="absolute -top-1 -bottom-1 w-0.5 bg-amber-500"
												style={{ left: `${timeline.actualInPct}%` }}
											/>
										) : null}
										{/* now/end marker */}
										{timeline.actualEndPct !== null &&
										timeline.actualEndPct !== timeline.actualInPct ? (
											<div
												className="absolute -top-1 -bottom-1 w-0.5 bg-primary"
												style={{ left: `${timeline.actualEndPct}%` }}
											/>
										) : null}
									</div>
									<div className="mt-2 flex justify-between font-mono text-[10px] text-muted-foreground">
										<span>shift {timeline.shiftStartLabel}</span>
										{timeline.actualInLabel ? (
											<span className="text-amber-600">
												in {timeline.actualInLabel}
											</span>
										) : null}
										{timeline.actualOutLabel ? (
											<span className="text-primary">
												{timeline.isActive ? 'now' : 'out'}{' '}
												{timeline.actualOutLabel}
											</span>
										) : null}
										<span>shift {timeline.shiftEndLabel}</span>
									</div>
								</div>
							) : null}

							{/* Punches */}
							<div className="flex-1 overflow-y-auto border-b px-4 py-4">
								<div className="mb-2 flex items-baseline justify-between">
									<div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
										Punches
									</div>
								</div>
								<div className="flex flex-col gap-1.5">
									{selected.session ? (
										<>
											<PunchRow
												time={formatTimeOnly(
													selected.session.timeIn,
													selected.profile.timezone,
												)}
												label="Clock in"
												tone={
													(selected.session.computed?.lateMinutes ?? 0) > 0
														? 'warn'
														: 'good'
												}
												badge={
													(selected.session.computed?.lateMinutes ?? 0) > 0
														? 'late'
														: 'ok'
												}
												meta="server log"
												onEdit={() => {
													if (selected.session) openEdit(selected.session);
												}}
											/>
											{selected.session.timeOut ? (
												<PunchRow
													time={formatTimeOnly(
														selected.session.timeOut,
														selected.profile.timezone,
													)}
													label="Clock out"
													tone="good"
													badge="ok"
													meta="server log"
													onEdit={() => {
														if (selected.session) openEdit(selected.session);
													}}
												/>
											) : (
												<PunchRow
													time={formatTimeOnly(
														new Date().toISOString(),
														selected.profile.timezone,
													)}
													label="Live · on the clock"
													tone="accent"
													badge="live"
													meta={`${formatHoursAndMinutes(selected.session.computed?.regularHours ?? 0)} so far`}
													onEdit={() => {
														if (selected.session) openEdit(selected.session);
													}}
												/>
											)}
										</>
									) : (
										<div className="rounded border bg-muted/30 px-3 py-6 text-center text-sm text-muted-foreground">
											No punches recorded today.
										</div>
									)}
								</div>
							</div>

							{/* Summary strip */}
							<div className="grid grid-cols-5 border-b">
								{[
									{
										l: 'Reg',
										v: formatHoursAndMinutes(
											selected.session?.computed?.regularHours ?? 0,
										),
									},
									{
										l: 'OT',
										v: formatHoursAndMinutes(
											selected.session?.computed?.overtimeHours ?? 0,
										),
										tone:
											(selected.session?.computed?.overtimeHours ?? 0) > 0
												? 'accent'
												: undefined,
									},
									{
										l: 'ND',
										v: formatHoursAndMinutes(
											selected.session?.computed?.nightDifferentialHours ?? 0,
										),
									},
									{
										l: 'Late',
										v: formatMinutes(
											selected.session?.computed?.lateMinutes ?? 0,
										),
										tone:
											(selected.session?.computed?.lateMinutes ?? 0) > 0
												? 'warn'
												: undefined,
									},
									{
										l: 'UT',
										v: formatMinutes(
											selected.session?.computed?.undertimeMinutes ?? 0,
										),
										tone:
											(selected.session?.computed?.undertimeMinutes ?? 0) > 0
												? 'warn'
												: undefined,
									},
								].map((s, i) => (
									<div
										key={s.l}
										className={cn(
											'border-r px-3 py-3 text-center last:border-r-0',
											i === 4 && 'border-r-0',
										)}
									>
										<div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
											{s.l}
										</div>
										<div
											className={cn(
												'mt-1 font-mono text-sm font-semibold tabular-nums',
												s.tone === 'warn' && 'text-amber-600',
												s.tone === 'accent' && 'text-primary',
											)}
										>
											{s.v}
										</div>
									</div>
								))}
							</div>

						</>
					) : (
						<div className="flex h-full items-center justify-center px-4 py-12 text-sm text-muted-foreground">
							Select an employee from the list.
						</div>
					)}
				</Card>
			</div>

			<EditPunchModal
				open={!!editingRecord}
				record={editingRecord}
				employee={
					editingRecord
						? (employees.find((e) => e.uid === editingRecord.userId) ?? null)
						: null
				}
				busy={editBusy}
				error={editError}
				onOpenChange={(open) => {
					if (!open) setEditingRecord(null);
				}}
				onSave={(body) => void handleSaveEdit(body)}
			/>
		</div>
	);
}

function PunchRow({
	time,
	label,
	tone,
	badge,
	meta,
	onEdit,
}: {
	time: string;
	label: string;
	tone: 'good' | 'warn' | 'accent';
	badge: string;
	meta: string;
	onEdit?: () => void;
}) {
	return (
		<div className="grid grid-cols-[60px_1fr_80px_24px] items-center gap-2 rounded border bg-card px-2.5 py-2">
			<div className="font-mono text-xs font-semibold">{time}</div>
			<div>
				<div className="text-sm font-medium">{label}</div>
				<div className="font-mono text-[10px] text-muted-foreground">
					{meta}
				</div>
			</div>
			<div className="flex justify-end">
				{tone === 'good' && (
					<Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-400">
						{badge}
					</Badge>
				)}
				{tone === 'warn' && (
					<Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/15 dark:text-amber-400">
						{badge}
					</Badge>
				)}
				{tone === 'accent' && (
					<Badge className="bg-primary/15 text-primary hover:bg-primary/15">
						{badge}
					</Badge>
				)}
			</div>
			{onEdit ? (
				<button
					type="button"
					onClick={onEdit}
					className="grid size-6 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
					aria-label="Edit punch"
				>
					<PencilIcon className="size-3.5" />
				</button>
			) : (
				<PencilIcon className="size-3.5 text-muted-foreground" />
			)}
		</div>
	);
}
