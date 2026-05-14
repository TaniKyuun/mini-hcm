import { useCallback, useEffect, useState } from 'react';
import { AttendanceTable } from '../components/AttendanceTable';
import { useProfile } from '../hooks/useProfile';
import { useAuth } from '../lib/auth';
import { fetchHistory } from '../services/attendanceService';
import type { AttendanceRecord } from '../types/api';

function defaultStartDate(): string {
	const d = new Date();
	d.setUTCDate(d.getUTCDate() - 13);
	return d.toISOString().slice(0, 10);
}

function defaultEndDate(): string {
	return new Date().toISOString().slice(0, 10);
}

export function History() {
	const { user } = useAuth();
	const { profile } = useProfile();
	const [startDate, setStartDate] = useState(defaultStartDate());
	const [endDate, setEndDate] = useState(defaultEndDate());
	const [records, setRecords] = useState<AttendanceRecord[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(
		async (signal?: AbortSignal) => {
			if (!user) return;
			setLoading(true);
			setError(null);
			try {
				const result = await fetchHistory(user, startDate, endDate, signal);
				setRecords(result.sessions);
			} catch (caught) {
				if ((caught as { name?: string })?.name === 'AbortError') return;
				setError(caught instanceof Error ? caught.message : 'Unknown error');
			} finally {
				setLoading(false);
			}
		},
		[user, startDate, endDate],
	);

	useEffect(() => {
		const controller = new AbortController();
		void load(controller.signal);
		return () => controller.abort();
	}, [load]);

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-xl font-semibold text-zinc-900">
					Attendance history
				</h2>
				<p className="text-sm text-zinc-500">
					Showing your completed and active sessions.
				</p>
			</div>

			<div className="flex flex-wrap items-end gap-4 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
				<label className="block">
					<span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
						Start date
					</span>
					<input
						type="date"
						value={startDate}
						onChange={(e) => setStartDate(e.target.value)}
						className="mt-1 block rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
					/>
				</label>
				<label className="block">
					<span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
						End date
					</span>
					<input
						type="date"
						value={endDate}
						onChange={(e) => setEndDate(e.target.value)}
						className="mt-1 block rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
					/>
				</label>
				<button
					type="button"
					onClick={() => void load()}
					disabled={loading}
					className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium transition hover:border-zinc-400 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
				>
					{loading ? 'Loading...' : 'Refresh'}
				</button>
			</div>

			{error ? (
				<p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
					{error}
				</p>
			) : null}

			<AttendanceTable
				records={records}
				timezone={profile?.timezone}
				emptyMessage="No sessions in this date range."
			/>
		</div>
	);
}
