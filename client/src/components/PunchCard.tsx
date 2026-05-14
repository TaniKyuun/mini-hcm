import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { postPunchIn, postPunchOut } from '../services/attendanceService';
import type { AttendanceRecord } from '../types/api';
import { formatDuration, formatTimeOnly } from '../utils/formatTime';

type PunchCardProps = {
	session: AttendanceRecord | null;
	timezone?: string;
	onChange: (session: AttendanceRecord | null) => void;
};

export function PunchCard({ session, timezone, onChange }: PunchCardProps) {
	const { user } = useAuth();
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [now, setNow] = useState(() => Date.now());

	useEffect(() => {
		if (!session) return;
		const interval = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(interval);
	}, [session]);

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

	const elapsed =
		session && session.status === 'active'
			? now - new Date(session.timeIn).getTime()
			: 0;

	return (
		<div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
			<div className="flex items-start justify-between gap-4">
				<div>
					<p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
						{session && session.status === 'active'
							? 'On the clock'
							: 'Not punched in'}
					</p>
					<p className="mt-2 text-3xl font-semibold tabular-nums text-zinc-900">
						{session && session.status === 'active'
							? formatDuration(elapsed)
							: '—'}
					</p>
					{session && session.status === 'active' ? (
						<p className="mt-1 text-xs text-zinc-500">
							Since {formatTimeOnly(session.timeIn, timezone)}
						</p>
					) : (
						<p className="mt-1 text-xs text-zinc-500">
							Punch in to start the timer.
						</p>
					)}
				</div>

				{session && session.status === 'active' ? (
					<button
						type="button"
						className="rounded-md bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
						onClick={handlePunchOut}
						disabled={busy}
					>
						{busy ? 'Punching out...' : 'Punch out'}
					</button>
				) : (
					<button
						type="button"
						className="rounded-md bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
						onClick={handlePunchIn}
						disabled={busy}
					>
						{busy ? 'Punching in...' : 'Punch in'}
					</button>
				)}
			</div>

			{error ? (
				<p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
					{error}
				</p>
			) : null}
		</div>
	);
}
