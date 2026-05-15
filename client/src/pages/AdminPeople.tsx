import {
	ArrowDownIcon,
	ArrowUpIcon,
	ClockIcon,
	FilterIcon,
	LogInIcon,
	LogOutIcon,
	PencilIcon,
	PlusIcon,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import {
	fetchAdminAttendance,
	fetchEmployees,
	fetchWeeklyReport,
} from '@/services/adminService';
import type { AttendanceRecord, DailySummary, UserProfile } from '@/types/api';
import { addDaysIso, startOfWeekIso } from '@/utils/dateIso';
import { decorateEmployee, initialsOf } from '@/utils/employeeMock';
import {
	formatDate,
	formatHoursAndMinutes,
	formatMinutes,
	formatTimeOnly,
} from '@/utils/formatTime';

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

export function AdminPeople() {
	const { user } = useAuth();
	const [employees, setEmployees] = useState<UserProfile[]>([]);
	const [weekSummaries, setWeekSummaries] = useState<DailySummary[]>([]);
	const [search, setSearch] = useState('');
	const [selectedUid, setSelectedUid] = useState<string | null>(null);
	const [selectedSessions, setSelectedSessions] = useState<AttendanceRecord[]>(
		[],
	);
	const [auditSort, setAuditSort] = useState<'desc' | 'asc'>('desc');
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		if (!user) return;
		try {
			const [emp, weekly] = await Promise.all([
				fetchEmployees(user),
				fetchWeeklyReport(user, startOfWeekIso()),
			]);
			setEmployees(emp.employees);
			setWeekSummaries(weekly.summaries);
		} catch (caught) {
			setError(caught instanceof Error ? caught.message : 'Unknown error');
		}
	}, [user]);

	useEffect(() => {
		void load();
	}, [load]);

	useEffect(() => {
		if (!selectedUid && employees.length > 0) {
			setSelectedUid(employees[0].uid);
		}
	}, [employees, selectedUid]);

	useEffect(() => {
		if (!user || !selectedUid) {
			setSelectedSessions([]);
			return;
		}
		const start = startOfWeekIso();
		const end = addDaysIso(start, 6);
		let cancelled = false;
		fetchAdminAttendance(user, selectedUid, start, end)
			.then((r) => {
				if (!cancelled) setSelectedSessions(r.sessions);
			})
			.catch(() => {
				if (!cancelled) setSelectedSessions([]);
			});
		return () => {
			cancelled = true;
		};
	}, [user, selectedUid]);

	const auditEvents = useMemo(() => {
		const events = buildAuditLog(selectedSessions);
		return events.sort((a, b) => {
			const diff = new Date(a.iso).getTime() - new Date(b.iso).getTime();
			return auditSort === 'asc' ? diff : -diff;
		});
	}, [selectedSessions, auditSort]);

	const decorated = useMemo(
		() =>
			employees.map((emp) => ({
				profile: emp,
				deco: decorateEmployee(emp),
			})),
		[employees],
	);

	const filtered = useMemo(() => {
		const term = search.trim().toLowerCase();
		if (!term) return decorated;
		return decorated.filter(({ profile, deco }) => {
			return (
				profile.name.toLowerCase().includes(term) ||
				profile.email.toLowerCase().includes(term) ||
				deco.role.toLowerCase().includes(term)
			);
		});
	}, [decorated, search]);

	const selected = useMemo(
		() => decorated.find((d) => d.profile.uid === selectedUid) ?? null,
		[decorated, selectedUid],
	);

	const selectedWeek = useMemo(() => {
		if (!selected) return null;
		const rows = weekSummaries.filter((s) => s.userId === selected.profile.uid);
		return rows.reduce(
			(acc, s) => ({
				regularHours: acc.regularHours + s.regularHours,
				overtimeHours: acc.overtimeHours + s.overtimeHours,
				nightDifferentialHours:
					acc.nightDifferentialHours + s.nightDifferentialHours,
				lateMinutes: acc.lateMinutes + s.lateMinutes,
				undertimeMinutes: acc.undertimeMinutes + s.undertimeMinutes,
				totalHours: acc.totalHours + s.totalHours,
				sessionsCount: acc.sessionsCount + s.sessionsCount,
			}),
			{
				regularHours: 0,
				overtimeHours: 0,
				nightDifferentialHours: 0,
				lateMinutes: 0,
				undertimeMinutes: 0,
				totalHours: 0,
				sessionsCount: 0,
			},
		);
	}, [selected, weekSummaries]);

	return (
		<div className="flex flex-col gap-4 px-4 lg:px-6">
			<div className="flex flex-wrap items-end justify-between gap-3">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight">
						Employees · Roster
					</h1>
					<p className="text-sm text-muted-foreground">
						Power view · {employees.length} employees · select a row to inspect
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button size="sm">
						<PlusIcon />
						Add employee
					</Button>
				</div>
			</div>

			{error ? (
				<p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
					{error}
				</p>
			) : null}

			<div className="grid min-h-0 flex-1 gap-4 @4xl/main:grid-cols-[1.45fr_1fr]">
				{/* LEFT — roster */}
				<Card className="gap-0 overflow-hidden p-0">
					<div className="flex items-center gap-2 border-b px-3 py-2">
						<Input
							type="search"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder={`Search · ${employees.length}`}
							className="flex-1"
						/>
						<Button variant="outline" size="icon-sm" aria-label="Filter">
							<FilterIcon />
						</Button>
					</div>
					<div className="flex items-center border-b bg-muted/30 px-3 py-2">
						<span className="ml-auto text-xs text-muted-foreground">
							{filtered.length} of {employees.length}
						</span>
					</div>
					<div className="grid grid-cols-[1.8fr_0.7fr_0.7fr] border-b bg-card px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
						<div>Employee · Role</div>
						<div>Schedule</div>
						<div className="text-right">Status</div>
					</div>
					<div className="flex-1 overflow-y-auto">
						{filtered.length === 0 ? (
							<div className="px-4 py-12 text-center text-sm text-muted-foreground">
								No employees match.
							</div>
						) : (
							filtered.map(({ profile, deco }) => {
								const isSel = profile.uid === selectedUid;
								return (
									<button
										type="button"
										key={profile.uid}
										onClick={() => setSelectedUid(profile.uid)}
										className={cn(
											'grid w-full grid-cols-[1.8fr_0.7fr_0.7fr] items-center gap-2 border-b border-l-[3px] border-l-transparent px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/40',
											isSel && 'border-l-primary bg-primary/10',
										)}
									>
										<div className="flex items-center gap-2">
											<Avatar className="size-7">
												<AvatarFallback className="text-xs">
													{initialsOf(profile.name)}
												</AvatarFallback>
											</Avatar>
											<div className="min-w-0">
												<div
													className={cn(
														'truncate',
														isSel ? 'font-semibold' : 'font-medium',
													)}
												>
													{profile.name}
												</div>
												<div className="truncate text-xs text-muted-foreground">
													{deco.role}
												</div>
											</div>
										</div>
										<div className="font-mono text-xs tabular-nums text-muted-foreground">
											{profile.schedule.start}–{profile.schedule.end}
										</div>
										<div className="text-right">
											{profile.role === 'admin' ? (
												<Badge className="bg-blue-500/15 text-blue-700 hover:bg-blue-500/15 dark:text-blue-400">
													admin
												</Badge>
											) : (
												<Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-400">
													● active
												</Badge>
											)}
										</div>
									</button>
								);
							})
						)}
					</div>
				</Card>

				{/* RIGHT — profile drawer */}
				<Card className="gap-0 overflow-hidden p-0">
					{selected ? (
						<>
							<div className="flex items-center gap-3 border-b px-4 py-4">
								<Avatar className="size-12 rounded-lg bg-foreground text-background">
									<AvatarFallback className="rounded-lg bg-foreground text-background font-semibold">
										{initialsOf(selected.profile.name)}
									</AvatarFallback>
								</Avatar>
								<div className="flex-1">
									<div className="text-lg font-semibold tracking-tight">
										{selected.profile.name}
									</div>
									<div className="text-xs text-muted-foreground">
										{selected.deco.role}
									</div>
								</div>
								{selected.profile.role === 'admin' ? (
									<Badge className="bg-blue-500/15 text-blue-700 hover:bg-blue-500/15 dark:text-blue-400">
										admin
									</Badge>
								) : (
									<Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-400">
										● active
									</Badge>
								)}
							</div>

							<div className="grid grid-cols-2 gap-3 border-b px-4 py-4">
								{[
									{ l: 'Employee ID', v: selected.deco.employeeId },
									{ l: 'Email', v: selected.profile.email },
									{
										l: 'Location',
										v: selected.profile.location ?? selected.deco.location,
									},
									{
										l: 'Timezone',
										v: selected.profile.timezone || '—',
									},
									{
										l: 'Employment',
										v:
											selected.profile.employmentType ??
											selected.deco.employment,
									},
									{
										l: 'Shift',
										v: `${selected.profile.schedule.start}–${selected.profile.schedule.end}`,
									},
								].map((m) => (
									<div key={m.l}>
										<div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
											{m.l}
										</div>
										<div className="text-sm">{m.v}</div>
									</div>
								))}
							</div>

							<div className="border-b px-4 py-4">
								<div className="mb-2 flex items-baseline justify-between">
									<div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
										This week · attendance
									</div>
									<span className="text-xs text-muted-foreground">
										{selectedWeek?.sessionsCount ?? 0} sessions
									</span>
								</div>
								<div className="grid grid-cols-5 gap-1.5">
									{[
										{
											l: 'Reg',
											v: formatHoursAndMinutes(selectedWeek?.regularHours ?? 0),
										},
										{
											l: 'OT',
											v: formatHoursAndMinutes(
												selectedWeek?.overtimeHours ?? 0,
											),
											tone:
												(selectedWeek?.overtimeHours ?? 0) > 0
													? 'accent'
													: undefined,
										},
										{
											l: 'ND',
											v: formatHoursAndMinutes(
												selectedWeek?.nightDifferentialHours ?? 0,
											),
										},
										{
											l: 'Late',
											v: formatMinutes(selectedWeek?.lateMinutes ?? 0),
											tone:
												(selectedWeek?.lateMinutes ?? 0) > 0
													? 'warn'
													: undefined,
										},
										{
											l: 'UT',
											v: formatMinutes(selectedWeek?.undertimeMinutes ?? 0),
											tone:
												(selectedWeek?.undertimeMinutes ?? 0) > 0
													? 'warn'
													: undefined,
										},
									].map((s) => (
										<div
											key={s.l}
											className={cn(
												'rounded border px-2 py-2 text-center',
												s.tone === 'warn' &&
													'border-amber-500/40 bg-amber-500/10',
												s.tone === 'accent' &&
													'border-primary/40 bg-primary/10',
											)}
										>
											<div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
												{s.l}
											</div>
											<div className="mt-1 font-mono text-xs font-semibold tabular-nums">
												{s.v}
											</div>
										</div>
									))}
								</div>
							</div>

							<div className="flex flex-1 flex-col border-b">
								<div className="flex items-center gap-2 border-b bg-muted/20 px-4 py-2">
									<h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
										Audit log
									</h3>
									<Badge variant="outline" className="text-[10px]">
										{auditEvents.length}
									</Badge>
									<Button
										variant="outline"
										size="xs"
										className="ml-auto"
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
								<div className="max-h-80 min-h-0 flex-1 overflow-y-auto">
									{auditEvents.length === 0 ? (
										<div className="px-4 py-8 text-center text-xs text-muted-foreground">
											No punch events for this employee this week.
										</div>
									) : (
										<ol className="flex flex-col">
											{auditEvents.map((e, i) => (
												<li
													key={e.id}
													className={cn(
														'grid grid-cols-[68px_24px_1fr_auto] items-center gap-2.5 px-4 py-2',
														i < auditEvents.length - 1 && 'border-b',
													)}
												>
													<div className="flex flex-col leading-tight">
														<span className="font-mono text-xs font-semibold tabular-nums">
															{formatTimeOnly(e.iso, selected.profile.timezone)}
														</span>
														<span className="text-[10px] text-muted-foreground">
															{formatDate(e.date)}
														</span>
													</div>
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
															<Badge
																variant="destructive"
																className="text-[10px]"
															>
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

							<div className="mt-auto flex gap-2 border-t bg-muted/30 px-4 py-3">
								<Button variant="outline" className="flex-1">
									<ClockIcon />
									Open attendance
								</Button>
								<Button variant="outline" className="flex-1">
									<PencilIcon />
									Edit profile
								</Button>
								<Button variant="destructive" size="default">
									<LogOutIcon />
									Off-board
								</Button>
							</div>
						</>
					) : (
						<div className="flex h-full items-center justify-center px-4 py-12 text-sm text-muted-foreground">
							Select an employee from the roster.
						</div>
					)}
				</Card>
			</div>
		</div>
	);
}
