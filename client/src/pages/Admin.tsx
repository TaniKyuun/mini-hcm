import {
	CalendarIcon,
	ChevronDownIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	PencilIcon,
	PlusIcon,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { EditPunchModal } from '@/components/EditPunchModal';
import { KpiCard } from '@/components/KpiCard';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/lib/auth';
import {
	adminUpdateAttendance,
	fetchAdminAttendance,
	fetchDailyReport,
	fetchEmployees,
} from '@/services/adminService';
import type { AttendanceRecord, DailySummary, UserProfile } from '@/types/api';
import { addDaysIso, dateToIso, isoToDate } from '@/utils/dateIso';
import { formatDate, formatHours, formatTimeOnly } from '@/utils/formatTime';

function today(): string {
	return dateToIso(new Date());
}

function formatViewedDate(iso: string): string {
	if (iso === today()) return 'Today';
	const d = isoToDate(iso);
	if (!d) return iso;
	return new Intl.DateTimeFormat(undefined, {
		weekday: 'short',
		month: 'short',
		day: 'numeric',
	}).format(d);
}

function initialsOf(name: string): string {
	const parts = name.trim().split(/\s+/);
	if (parts.length === 0) return '··';
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type WorkforceStats = {
	total: number;
	clockedIn: number;
	scheduled: number;
	pending: number;
	late: number;
};

function computeStats(
	employees: UserProfile[],
	summaries: DailySummary[],
): WorkforceStats {
	const total = employees.length;
	const scheduled = total;
	let clockedIn = 0;
	let late = 0;
	let pending = 0;
	for (const s of summaries) {
		if (s.sessionsCount > 0) clockedIn += 1;
		if (s.lateMinutes > 0) late += 1;
		if (s.totalHours === 0 && s.sessionsCount === 0) pending += 1;
	}
	return { total, clockedIn, scheduled, pending, late };
}

export function Admin() {
	const { user } = useAuth();
	const [date, setDate] = useState(today());
	const [datePickerOpen, setDatePickerOpen] = useState(false);
	const [employees, setEmployees] = useState<UserProfile[]>([]);
	const [summaries, setSummaries] = useState<DailySummary[]>([]);
	const [sessions, setSessions] = useState<Record<string, AttendanceRecord[]>>(
		{},
	);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [editing, setEditing] = useState<AttendanceRecord | null>(null);
	const [editBusy, setEditBusy] = useState(false);
	const [editError, setEditError] = useState<string | null>(null);
	const reportRequestId = useRef(0);

	const loadReport = useCallback(async () => {
		const requestId = reportRequestId.current + 1;
		reportRequestId.current = requestId;
		const isLatestRequest = () => reportRequestId.current === requestId;

		if (!user) return;
		if (!isLatestRequest()) return;
		setLoading(true);
		if (!isLatestRequest()) return;
		setError(null);
		try {
			const [empResult, reportResult] = await Promise.all([
				fetchEmployees(user),
				fetchDailyReport(user, date),
			]);
			if (!isLatestRequest()) return;
			setEmployees(empResult.employees);
			if (!isLatestRequest()) return;
			setSummaries(reportResult.summaries);

			const sessionsByUser: Record<string, AttendanceRecord[]> = {};
			await Promise.all(
				empResult.employees.map(async (emp) => {
					try {
						const r = await fetchAdminAttendance(user, emp.uid, date, date);
						if (!isLatestRequest()) return;
						sessionsByUser[emp.uid] = r.sessions;
					} catch {
						if (!isLatestRequest()) return;
						sessionsByUser[emp.uid] = [];
					}
				}),
			);
			if (!isLatestRequest()) return;
			setSessions(sessionsByUser);
		} catch (caught) {
			if (!isLatestRequest()) return;
			setError(caught instanceof Error ? caught.message : 'Unknown error');
		} finally {
			if (isLatestRequest()) {
				setLoading(false);
			}
		}
	}, [user, date]);

	useEffect(() => {
		void loadReport();
	}, [loadReport]);

	function openEdit(record: AttendanceRecord) {
		setEditing(record);
		setEditError(null);
	}

	async function saveEdit(body: {
		timeIn?: string;
		timeOut?: string | null;
		reason?: string;
		notify?: boolean;
	}) {
		if (!user || !editing) return;
		setEditBusy(true);
		setEditError(null);
		try {
			await adminUpdateAttendance(user, editing.id, {
				timeIn: body.timeIn,
				timeOut: body.timeOut,
				reason: body.reason,
				notify: body.notify,
			});
			setEditing(null);
			await loadReport();
		} catch (caught) {
			setEditError(caught instanceof Error ? caught.message : 'Unknown error');
		} finally {
			setEditBusy(false);
		}
	}

	const stats = computeStats(employees, summaries);
	const summariesByUser = new Map(summaries.map((s) => [s.userId, s]));

	return (
		<div className="flex flex-col gap-6 px-4 lg:px-6">
			<div className="flex flex-wrap items-end justify-between gap-3">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight">
						Admin dashboard
					</h1>
					<p className="text-sm text-muted-foreground">
						Overview of workforce activity · {formatDate(date)}
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
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
						<PopoverContent className="w-auto overflow-hidden p-0" align="end">
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
						onClick={() => setDate(today())}
						disabled={date === today()}
					>
						Today
					</Button>
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

			<div className="grid grid-cols-2 gap-3 @4xl/main:grid-cols-4">
				<KpiCard
					label="Total workforce"
					value={String(stats.total)}
					hint={`${stats.scheduled} scheduled`}
				/>
				<KpiCard
					label="Clocked in"
					value={String(stats.clockedIn)}
					hint={`of ${stats.scheduled} scheduled`}
				/>
				<KpiCard
					label="Pending"
					value={String(stats.pending)}
					hint="no punch yet"
					accent="primary"
				/>
				<KpiCard
					label="Late today"
					value={String(stats.late)}
					hint="incidents"
				/>
			</div>

			<div className="flex flex-col gap-3">
				<div className="flex flex-wrap items-center gap-3">
					<h2 className="text-sm font-semibold">Today's attendance</h2>
					<Badge variant="outline">{employees.length} people</Badge>
				</div>
				<div className="w-full">
					<div className="[&>div]:rounded-sm [&>div]:border">
						<Table>
							<TableHeader>
								<TableRow className="hover:bg-transparent">
									<TableHead>Name</TableHead>
									<TableHead>Clock in</TableHead>
									<TableHead>Clock out</TableHead>
									<TableHead className="text-right">Total</TableHead>
									<TableHead>Status</TableHead>
									<TableHead className="text-right" />
								</TableRow>
							</TableHeader>
							<TableBody>
								{loading && employees.length === 0 ? (
									<TableRow>
										<TableCell
											colSpan={6}
											className="py-8 text-center text-muted-foreground"
										>
											Loading…
										</TableCell>
									</TableRow>
								) : null}
								{employees.map((emp) => {
									const empSessions = sessions[emp.uid] ?? [];
									const latest = empSessions[empSessions.length - 1];
									const summary = summariesByUser.get(emp.uid);
									const onShift = empSessions.some(
										(s) => s.status === 'active',
									);
									const isLate = (summary?.lateMinutes ?? 0) > 0;
									const absent = empSessions.length === 0;

									return (
										<TableRow key={emp.uid}>
											<TableCell>
												<div className="flex items-center gap-3">
													<Avatar>
														<AvatarFallback className="text-xs">
															{initialsOf(emp.name)}
														</AvatarFallback>
													</Avatar>
													<div className="font-medium">{emp.name}</div>
												</div>
											</TableCell>
											<TableCell className="font-mono tabular-nums">
												{latest
													? formatTimeOnly(latest.timeIn, emp.timezone)
													: '—'}
											</TableCell>
											<TableCell className="font-mono tabular-nums">
												{latest?.timeOut
													? formatTimeOnly(latest.timeOut, emp.timezone)
													: '—'}
											</TableCell>
											<TableCell className="text-right font-mono tabular-nums">
												{formatHours(summary?.totalHours ?? 0)}h
											</TableCell>
											<TableCell>
												{onShift ? (
													<Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-400">
														● on shift
													</Badge>
												) : isLate ? (
													<Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/15 dark:text-amber-400">
														late {summary?.lateMinutes}m
													</Badge>
												) : absent ? (
													<Badge variant="destructive">absent</Badge>
												) : (
													<Badge variant="secondary">completed</Badge>
												)}
											</TableCell>
											<TableCell className="text-right">
												{latest ? (
													<Button
														variant="outline"
														size="xs"
														onClick={() => openEdit(latest)}
													>
														<PencilIcon />
														Edit
													</Button>
												) : null}
											</TableCell>
										</TableRow>
									);
								})}
								{!loading && employees.length === 0 ? (
									<TableRow>
										<TableCell
											colSpan={6}
											className="py-8 text-center text-muted-foreground"
										>
											No employees yet.
										</TableCell>
									</TableRow>
								) : null}
							</TableBody>
						</Table>
					</div>
				</div>
			</div>

			<EditPunchModal
				open={!!editing}
				record={editing}
				employee={
					editing
						? (employees.find((e) => e.uid === editing.userId) ?? null)
						: null
				}
				busy={editBusy}
				error={editError}
				onOpenChange={(open) => !open && setEditing(null)}
				onSave={(body) => void saveEdit(body)}
			/>
		</div>
	);
}
