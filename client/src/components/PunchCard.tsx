import {
	ArrowRightIcon,
	CalendarIcon,
	PlayIcon,
	StopCircleIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';
import { postPunchIn, postPunchOut } from '@/services/attendanceService';
import type { AttendanceRecord } from '@/types/api';
import { formatDurationWithSeconds, formatTimeOnly } from '@/utils/formatTime';

type PunchCardProps = {
	session: AttendanceRecord | null;
	timezone?: string;
	onChange: (session: AttendanceRecord | null) => void;
};

function formatLiveClock(date: Date, timezone?: string): string {
	return new Intl.DateTimeFormat(undefined, {
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: false,
		timeZone: timezone,
	}).format(date);
}

export function PunchCard({ session, timezone, onChange }: PunchCardProps) {
	const { user } = useAuth();
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [now, setNow] = useState(() => Date.now());

	useEffect(() => {
		const interval = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(interval);
	}, []);

	async function handlePunchIn() {
		if (!user || busy) return;
		setBusy(true);
		setError(null);
		try {
			const created = await postPunchIn(user);
			onChange(created);
		} catch (caught) {
			setError(caught instanceof Error ? caught.message : 'Unknown error');
		} finally {
			setBusy(false);
		}
	}

	async function handlePunchOut() {
		if (!user || busy) return;
		setBusy(true);
		setError(null);
		try {
			await postPunchOut(user);
			onChange(null);
		} catch (caught) {
			setError(caught instanceof Error ? caught.message : 'Unknown error');
		} finally {
			setBusy(false);
		}
	}

	const isActive = session?.status === 'active';
	const elapsed =
		isActive && session ? now - new Date(session.timeIn).getTime() : 0;
	const liveClock = formatLiveClock(new Date(now), timezone);
	const todayLabel = new Intl.DateTimeFormat(undefined, {
		month: 'short',
		day: 'numeric',
		timeZone: timezone,
	}).format(new Date(now));

	return (
		<Card className="overflow-hidden">
			<CardContent className="flex flex-col gap-4 px-0">
				<div className="flex flex-wrap items-end justify-between gap-4 border-b px-6 pb-4">
					<div>
						<p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
							Current shift · live
						</p>
						<p className="mt-2 font-mono text-5xl font-medium leading-none tracking-tight tabular-nums">
							{liveClock}
						</p>
						<p className="mt-2 text-xs text-muted-foreground">
							{isActive && session
								? `Punched in @ ${formatTimeOnly(session.timeIn, timezone)} · ${formatDurationWithSeconds(elapsed)} elapsed`
								: 'Not punched in · tap Punch in to start your shift'}
						</p>
					</div>
					<div className="flex flex-col items-end gap-1.5">
						{isActive ? (
							<Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-400">
								● Punched in
							</Badge>
						) : (
							<Badge variant="outline">○ Off shift</Badge>
						)}
					</div>
				</div>

				<div className="flex flex-col gap-3 px-6">
					<div className="flex flex-wrap items-stretch gap-3">
						{isActive ? (
							<Button
								className="h-14 flex-1 text-base font-semibold"
								onClick={handlePunchOut}
								disabled={busy}
							>
								<StopCircleIcon />
								{busy ? 'Punching out…' : 'Punch out'}
							</Button>
						) : (
							<Button
								className="h-14 flex-1 text-base font-semibold"
								onClick={handlePunchIn}
								disabled={busy}
							>
								<PlayIcon />
								{busy ? 'Punching in…' : 'Punch in'}
							</Button>
						)}
					</div>
					<Link
						to="/history"
						className="flex h-11 items-center justify-between rounded-md border border-dashed border-border bg-card px-4 text-sm font-medium transition-colors hover:bg-muted"
					>
						<span className="inline-flex items-center gap-2">
							<CalendarIcon className="size-3.5" />
							View today's daily summary
						</span>
						<span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
							{todayLabel}
							<ArrowRightIcon className="size-3" />
						</span>
					</Link>
					{error ? (
						<p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
							{error}
						</p>
					) : null}
				</div>
			</CardContent>
		</Card>
	);
}
