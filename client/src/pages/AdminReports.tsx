import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { fetchDailyReport, fetchWeeklyReport } from '@/services/adminService';
import type { DailySummary, UserProfile } from '@/types/api';
import {
	addDaysIso,
	dateToIso,
	isoToDate,
	startOfWeekIso,
} from '@/utils/dateIso';
import { initialsOf } from '@/utils/employeeMock';
import { formatHoursAndMinutes, formatMinutes } from '@/utils/formatTime';

type Totals = {
	regular: number;
	overtime: number;
	nightDiff: number;
	lateMinutes: number;
	undertimeMinutes: number;
	sessions: number;
};

function emptyTotals(): Totals {
	return {
		regular: 0,
		overtime: 0,
		nightDiff: 0,
		lateMinutes: 0,
		undertimeMinutes: 0,
		sessions: 0,
	};
}

function sumTotals(rows: DailySummary[]): Totals {
	return rows.reduce(
		(acc, s) => ({
			regular: acc.regular + s.regularHours,
			overtime: acc.overtime + s.overtimeHours,
			nightDiff: acc.nightDiff + s.nightDifferentialHours,
			lateMinutes: acc.lateMinutes + s.lateMinutes,
			undertimeMinutes: acc.undertimeMinutes + s.undertimeMinutes,
			sessions: acc.sessions + s.sessionsCount,
		}),
		emptyTotals(),
	);
}

function todayIso(): string {
	return dateToIso(new Date());
}

function formatDateShort(iso: string): string {
	const d = isoToDate(iso);
	if (!d) return iso;
	return new Intl.DateTimeFormat(undefined, {
		weekday: 'short',
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	}).format(d);
}

function weekLabel(start: string): string {
	const startD = isoToDate(start);
	const endD = isoToDate(addDaysIso(start, 6));
	if (!startD || !endD) return start;
	const sameMonth = startD.getMonth() === endD.getMonth();
	const fmtStart = new Intl.DateTimeFormat(undefined, {
		month: 'short',
		day: 'numeric',
	}).format(startD);
	const fmtEnd = sameMonth
		? new Intl.DateTimeFormat(undefined, { day: 'numeric' }).format(endD)
		: new Intl.DateTimeFormat(undefined, {
				month: 'short',
				day: 'numeric',
			}).format(endD);
	return `${fmtStart} – ${fmtEnd}`;
}

function isoWeekNumber(iso: string): number {
	const d = new Date(`${iso}T12:00:00Z`);
	const target = new Date(
		Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
	);
	const dayNr = (target.getUTCDay() + 6) % 7;
	target.setUTCDate(target.getUTCDate() - dayNr + 3);
	const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
	const diff = (target.getTime() - firstThursday.getTime()) / 86400000;
	return 1 + Math.round((diff - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
}

export function AdminReports() {
	const { user } = useAuth();
	const [dailyDate, setDailyDate] = useState(todayIso());
	const [weekStart, setWeekStart] = useState(startOfWeekIso());
	const [employees, setEmployees] = useState<UserProfile[]>([]);
	const [dailySummaries, setDailySummaries] = useState<DailySummary[]>([]);
	const [weeklySummaries, setWeeklySummaries] = useState<DailySummary[]>([]);
	const [error, setError] = useState<string | null>(null);

	const loadDaily = useCallback(async () => {
		if (!user) return;
		try {
			const r = await fetchDailyReport(user, dailyDate);
			setEmployees((prev) => (prev.length === 0 ? r.employees : prev));
			setDailySummaries(r.summaries);
		} catch (caught) {
			setError(caught instanceof Error ? caught.message : 'Unknown error');
		}
	}, [user, dailyDate]);

	const loadWeekly = useCallback(async () => {
		if (!user) return;
		try {
			const r = await fetchWeeklyReport(user, weekStart);
			setEmployees((prev) => (prev.length === 0 ? r.employees : prev));
			setWeeklySummaries(r.summaries);
		} catch (caught) {
			setError(caught instanceof Error ? caught.message : 'Unknown error');
		}
	}, [user, weekStart]);

	useEffect(() => {
		void loadDaily();
	}, [loadDaily]);

	useEffect(() => {
		void loadWeekly();
	}, [loadWeekly]);

	const dailyByUser = useMemo(() => {
		const map = new Map<string, DailySummary>();
		for (const s of dailySummaries) map.set(s.userId, s);
		return map;
	}, [dailySummaries]);

	const weeklyByUser = useMemo(() => {
		const map = new Map<string, Totals>();
		for (const s of weeklySummaries) {
			const acc = map.get(s.userId) ?? emptyTotals();
			map.set(s.userId, {
				regular: acc.regular + s.regularHours,
				overtime: acc.overtime + s.overtimeHours,
				nightDiff: acc.nightDiff + s.nightDifferentialHours,
				lateMinutes: acc.lateMinutes + s.lateMinutes,
				undertimeMinutes: acc.undertimeMinutes + s.undertimeMinutes,
				sessions: acc.sessions + s.sessionsCount,
			});
		}
		return map;
	}, [weeklySummaries]);

	const dailyTotals = sumTotals(dailySummaries);
	const weeklyTotals = sumTotals(weeklySummaries);

	const dailyAbsent = employees.reduce((acc, e) => {
		const s = dailyByUser.get(e.uid);
		return acc + (s && s.sessionsCount > 0 ? 0 : 1);
	}, 0);

	const dailyRows = employees
		.map((e) => ({
			profile: e,
			summary: dailyByUser.get(e.uid) ?? null,
		}))
		.slice(0, 8);

	const weeklyRows = employees
		.map((e) => ({
			profile: e,
			totals: weeklyByUser.get(e.uid) ?? emptyTotals(),
		}))
		.slice(0, 8);

	return (
		<div className="flex min-h-0 flex-1 flex-col gap-4 px-4 lg:px-6">
			<div className="flex flex-wrap items-end justify-between gap-3">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight">
						Attendance reports
					</h1>
					<p className="text-sm text-muted-foreground">
						Today's snapshot &amp; this week's roll-up, side-by-side
					</p>
				</div>
			</div>

			{error ? (
				<p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
					{error}
				</p>
			) : null}

			<div className="grid min-h-0 flex-1 gap-4 @4xl/main:grid-cols-2">
				{/* DAILY */}
				<Card className="gap-0 overflow-hidden p-0">
					<div className="flex items-center gap-2 border-b px-4 py-3">
						<Badge className="bg-foreground text-background hover:bg-foreground">
							Daily
						</Badge>
						<div className="text-sm font-semibold">
							{formatDateShort(dailyDate)}
						</div>
						<div className="ml-auto flex items-center gap-1">
							<Popover>
								<PopoverTrigger
									render={
										<Button variant="outline" size="xs">
											<CalendarIcon />
											Pick date
										</Button>
									}
								/>
								<PopoverContent align="end" className="w-auto p-2">
									<Calendar
										mode="single"
										selected={isoToDate(dailyDate)}
										defaultMonth={isoToDate(dailyDate)}
										onSelect={(d) => {
											if (d) setDailyDate(dateToIso(d));
										}}
									/>
								</PopoverContent>
							</Popover>
							<Button
								variant="ghost"
								size="icon-sm"
								onClick={() => setDailyDate(addDaysIso(dailyDate, -1))}
								aria-label="Previous day"
							>
								<ChevronLeftIcon />
							</Button>
							<Button
								variant="ghost"
								size="icon-sm"
								onClick={() => setDailyDate(addDaysIso(dailyDate, 1))}
								aria-label="Next day"
							>
								<ChevronRightIcon />
							</Button>
							<Button
								variant="outline"
								size="xs"
								onClick={() => setDailyDate(todayIso())}
							>
								Today
							</Button>
						</div>
					</div>
					<TotalsStrip totals={dailyTotals} />
					<div className="flex-1 overflow-y-auto">
						<MetricsTable
							rows={dailyRows.map((r) => ({
								profile: r.profile,
								regular: r.summary?.regularHours ?? 0,
								overtime: r.summary?.overtimeHours ?? 0,
								nightDiff: r.summary?.nightDifferentialHours ?? 0,
								lateMinutes: r.summary?.lateMinutes ?? 0,
								undertimeMinutes: r.summary?.undertimeMinutes ?? 0,
								absent: !r.summary || r.summary.sessionsCount === 0,
							}))}
						/>
					</div>
					<div className="flex items-center justify-between border-t bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
						<span>
							{employees.length - dailyAbsent} active · {dailyAbsent} absent
						</span>
						<span className="font-mono tabular-nums">
							{employees.length - dailyAbsent} / {employees.length} expected
						</span>
					</div>
				</Card>

				{/* WEEKLY */}
				<Card className="gap-0 overflow-hidden p-0">
					<div className="flex items-center gap-2 border-b px-4 py-3">
						<Badge className="bg-foreground text-background hover:bg-foreground">
							Weekly
						</Badge>
						<div className="text-sm font-semibold">
							Wk {isoWeekNumber(weekStart)} · {weekLabel(weekStart)}
						</div>
						<div className="ml-auto flex items-center gap-1">
							<Popover>
								<PopoverTrigger
									render={
										<Button variant="outline" size="xs">
											<CalendarIcon />
											Pick week
										</Button>
									}
								/>
								<PopoverContent align="end" className="w-auto p-2">
									<Calendar
										mode="single"
										selected={isoToDate(weekStart)}
										defaultMonth={isoToDate(weekStart)}
										onSelect={(d) => {
											if (d) setWeekStart(startOfWeekIso(d));
										}}
									/>
								</PopoverContent>
							</Popover>
							<Button
								variant="ghost"
								size="icon-sm"
								onClick={() => setWeekStart(addDaysIso(weekStart, -7))}
								aria-label="Previous week"
							>
								<ChevronLeftIcon />
							</Button>
							<Button
								variant="ghost"
								size="icon-sm"
								onClick={() => setWeekStart(addDaysIso(weekStart, 7))}
								aria-label="Next week"
							>
								<ChevronRightIcon />
							</Button>
							<Button
								variant="outline"
								size="xs"
								onClick={() => setWeekStart(startOfWeekIso())}
							>
								This week
							</Button>
						</div>
					</div>
					<TotalsStrip totals={weeklyTotals} />
					<div className="flex-1 overflow-y-auto">
						<MetricsTable
							rows={weeklyRows.map((r) => ({
								profile: r.profile,
								regular: r.totals.regular,
								overtime: r.totals.overtime,
								nightDiff: r.totals.nightDiff,
								lateMinutes: r.totals.lateMinutes,
								undertimeMinutes: r.totals.undertimeMinutes,
								absent: r.totals.sessions === 0,
							}))}
						/>
					</div>
					<div className="flex items-center border-t bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
						<span>{employees.length} employees</span>
					</div>
				</Card>
			</div>
		</div>
	);
}

function TotalsStrip({ totals }: { totals: Totals }) {
	const cells = [
		{ l: 'Reg', v: formatHoursAndMinutes(totals.regular), tone: undefined },
		{
			l: 'OT',
			v: formatHoursAndMinutes(totals.overtime),
			tone: totals.overtime > 0 ? 'accent' : undefined,
		},
		{
			l: 'ND',
			v: formatHoursAndMinutes(totals.nightDiff),
			tone: undefined,
		},
		{
			l: 'Late',
			v: formatMinutes(totals.lateMinutes),
			tone: totals.lateMinutes > 0 ? 'warn' : undefined,
		},
		{
			l: 'UT',
			v: formatMinutes(totals.undertimeMinutes),
			tone: totals.undertimeMinutes > 0 ? 'warn' : undefined,
		},
	];
	return (
		<div className="grid grid-cols-5 border-b">
			{cells.map((c, i) => (
				<div
					key={c.l}
					className={cn(
						'border-r px-2 py-2.5 text-center last:border-r-0',
						i === 4 && 'border-r-0',
						c.tone === 'warn' && 'bg-amber-500/10',
						c.tone === 'accent' && 'bg-primary/10',
					)}
				>
					<div className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
						{c.l}
					</div>
					<div
						className={cn(
							'mt-0.5 font-mono text-sm font-semibold tabular-nums',
							c.tone === 'warn' && 'text-amber-600',
							c.tone === 'accent' && 'text-primary',
						)}
					>
						{c.v}
					</div>
				</div>
			))}
		</div>
	);
}

type MetricRow = {
	profile: UserProfile;
	regular: number;
	overtime: number;
	nightDiff: number;
	lateMinutes: number;
	undertimeMinutes: number;
	absent: boolean;
};

function MetricsTable({ rows }: { rows: MetricRow[] }) {
	return (
		<div>
			<div className="sticky top-0 grid grid-cols-[1.6fr_0.65fr_0.65fr_0.55fr_0.5fr_0.5fr] border-b bg-muted/40 px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
				<div>Employee</div>
				<div className="text-right">Regular</div>
				<div className="text-right">OT</div>
				<div className="text-right">ND</div>
				<div className="text-right">Late</div>
				<div className="text-right">UT</div>
			</div>
			{rows.length === 0 ? (
				<div className="px-3 py-8 text-center text-sm text-muted-foreground">
					No data.
				</div>
			) : (
				rows.map((r) => (
					<div
						key={r.profile.uid}
						className={cn(
							'grid grid-cols-[1.6fr_0.65fr_0.65fr_0.55fr_0.5fr_0.5fr] items-center border-b px-3 py-2 text-sm',
							r.absent && 'opacity-50',
						)}
					>
						<div className="flex items-center gap-2">
							<Avatar className="size-6">
								<AvatarFallback className="text-[10px]">
									{initialsOf(r.profile.name)}
								</AvatarFallback>
							</Avatar>
							<span className="truncate">{r.profile.name}</span>
							{r.absent ? (
								<Badge variant="destructive" className="text-[10px]">
									absent
								</Badge>
							) : null}
						</div>
						<div className="text-right font-mono tabular-nums">
							{r.absent ? '-' : formatHoursAndMinutes(r.regular)}
						</div>
						<div
							className={cn(
								'text-right font-mono tabular-nums',
								r.overtime > 0 ? 'text-primary' : 'text-muted-foreground',
							)}
						>
							{r.absent ? '-' : formatHoursAndMinutes(r.overtime)}
						</div>
						<div className="text-right font-mono tabular-nums text-muted-foreground">
							{r.absent ? '-' : formatHoursAndMinutes(r.nightDiff)}
						</div>
						<div
							className={cn(
								'text-right font-mono tabular-nums',
								r.lateMinutes > 0 ? 'text-amber-600' : 'text-muted-foreground',
							)}
						>
							{r.absent ? '-' : formatMinutes(r.lateMinutes)}
						</div>
						<div
							className={cn(
								'text-right font-mono tabular-nums',
								r.undertimeMinutes > 0
									? 'text-amber-600'
									: 'text-muted-foreground',
							)}
						>
							{r.absent ? '-' : formatMinutes(r.undertimeMinutes)}
						</div>
					</div>
				))
			)}
		</div>
	);
}
