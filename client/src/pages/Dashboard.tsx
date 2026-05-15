import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AttendanceTable } from '@/components/AttendanceTable';
import { KpiCard } from '@/components/KpiCard';
import { PunchCard } from '@/components/PunchCard';
import { useActiveSession } from '@/hooks/useActiveSession';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/lib/auth';
import { fetchHistory } from '@/services/attendanceService';
import type { AttendanceRecord } from '@/types/api';
import {
	formatDate,
	formatDurationWithSeconds,
	formatTimeOnly,
} from '@/utils/formatTime';

function daysAgoIso(days: number): string {
	const d = new Date();
	d.setUTCDate(d.getUTCDate() - days);
	return d.toISOString().slice(0, 10);
}

function todayIso(): string {
	const t = new Date();
	const y = t.getFullYear();
	const m = String(t.getMonth() + 1).padStart(2, '0');
	const d = String(t.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

function sessionDurationMs(s: AttendanceRecord, nowMs: number): number {
	const startMs = new Date(s.timeIn).getTime();
	const endMs = s.timeOut ? new Date(s.timeOut).getTime() : nowMs;
	return Math.max(0, endMs - startMs);
}

export function Dashboard() {
	const { user } = useAuth();
	const navigate = useNavigate();
	const { profile } = useProfile();
	const { session, setSession, refresh: refreshSession } = useActiveSession();

	const [recent, setRecent] = useState<AttendanceRecord[]>([]);
	const [now, setNow] = useState(() => Date.now());

	useEffect(() => {
		if (session?.status !== 'active') return;
		const id = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(id);
	}, [session?.status]);

	const loadRecent = useCallback(
		async (signal?: AbortSignal) => {
			if (!user) return;
			try {
				const result = await fetchHistory(
					user,
					daysAgoIso(6),
					todayIso(),
					signal,
				);
				setRecent(result.sessions);
			} catch {
				/* non-fatal */
			}
		},
		[user],
	);

	useEffect(() => {
		const controller = new AbortController();
		void loadRecent(controller.signal);
		return () => controller.abort();
	}, [loadRecent]);

	function handleSessionChange(next: AttendanceRecord | null) {
		setSession(next);
		void refreshSession();
		void loadRecent();
	}

	const today = todayIso();
	const isLive = session?.status === 'active';

	// Server stores timeIn/timeOut as Firestore Timestamps (absolute UTC moments).
	// Total time worked today = sum of real session durations: (timeOut - timeIn)
	// for completed sessions plus (now - timeIn) for the active session. This is
	// independent of the schedule, so it makes sense even if punches fall
	// outside the scheduled window.
	const todaysSessions = useMemo(() => {
		const list = recent.filter((r) => r.date === today);
		if (isLive && session && !list.some((r) => r.id === session.id)) {
			list.push(session);
		}
		return list;
	}, [recent, today, isLive, session]);

	const totalWorkedMs = useMemo(
		() => todaysSessions.reduce((acc, s) => acc + sessionDurationMs(s, now), 0),
		[todaysSessions, now],
	);

	const sessionCount = todaysSessions.length;
	const liveShiftMs = isLive && session ? sessionDurationMs(session, now) : 0;

	const scheduleLabel = profile
		? `${profile.schedule.start} – ${profile.schedule.end}`
		: '—';

	const recentForTable = useMemo(() => recent.slice(0, 6), [recent]);

	const greeting = (() => {
		const hour = new Date().getHours();
		if (hour < 12) return 'Good morning';
		if (hour < 18) return 'Good afternoon';
		return 'Good evening';
	})();

	return (
		<div className="flex flex-col gap-6 px-4 lg:px-6">
			<div className="flex flex-wrap items-end justify-between gap-3">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight">
						{greeting}
						{profile ? `, ${profile.name.split(' ')[0]}` : ''}.
					</h1>
					<p className="text-sm text-muted-foreground">
						{formatDate(today)}
						{isLive && session
							? ` · clocked in since ${formatTimeOnly(session.timeIn, profile?.timezone)}`
							: ` · scheduled ${scheduleLabel}`}
					</p>
				</div>
			</div>

			<div className="grid gap-4 @4xl/main:grid-cols-[1.2fr_0.8fr]">
				<PunchCard
					session={session}
					timezone={profile?.timezone}
					onChange={handleSessionChange}
				/>

				<div className="flex flex-col gap-3">
					<div className="flex items-baseline justify-between">
						<h2 className="text-sm font-semibold">Today's summary</h2>
						<span className="text-xs text-muted-foreground">
							{formatDate(today)}
						</span>
					</div>
					<div className="grid grid-cols-2 gap-3">
						<KpiCard
							label="Hours worked"
							value={formatDurationWithSeconds(totalWorkedMs)}
							hint={
								isLive ? 'live · across all sessions' : 'across all sessions'
							}
						/>
						<KpiCard
							label="Sessions today"
							value={String(sessionCount)}
							hint={
								sessionCount === 0
									? 'no punches yet'
									: isLive
										? `${sessionCount - 1} completed · 1 active`
										: `${sessionCount} completed`
							}
						/>
						<KpiCard
							label={isLive ? 'Current shift' : 'Last shift'}
							value={
								isLive
									? formatDurationWithSeconds(liveShiftMs)
									: sessionCount > 0
										? formatDurationWithSeconds(
												sessionDurationMs(
													todaysSessions[todaysSessions.length - 1],
													now,
												),
											)
										: '—'
							}
							hint={
								isLive && session
									? `since ${formatTimeOnly(session.timeIn, profile?.timezone)}`
									: sessionCount > 0
										? 'completed'
										: 'off shift'
							}
						/>
						<KpiCard
							label="Schedule"
							value={scheduleLabel}
							hint={isLive ? 'on the clock' : 'not punched in'}
						/>
					</div>
				</div>
			</div>

			<section className="flex flex-col gap-3">
				<div className="flex items-baseline justify-between">
					<h2 className="text-sm font-semibold">Last 7 days</h2>
					<div className="flex items-center gap-2">
						<Link
							to="/history"
							className="text-xs text-muted-foreground hover:text-foreground"
						>
							View full history →
						</Link>
					</div>
				</div>
				<AttendanceTable
					records={recentForTable}
					timezone={profile?.timezone}
					emptyMessage="No sessions in the last 7 days."
					onViewDetails={(record) =>
						navigate(`/history?date=${encodeURIComponent(record.date)}`)
					}
				/>
			</section>
		</div>
	);
}
