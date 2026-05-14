import { useCallback, useEffect, useState } from 'react';
import { AttendanceTable } from '../components/AttendanceTable';
import { ReportTable } from '../components/ReportTable';
import { useAuth } from '../lib/auth';
import {
	adminUpdateAttendance,
	fetchAdminAttendance,
	fetchDailyReport,
	fetchEmployees,
} from '../services/adminService';
import type { AttendanceRecord, DailySummary, UserProfile } from '../types/api';

function today(): string {
	return new Date().toISOString().slice(0, 10);
}

function toLocalDateTimeInput(iso: string | null): string {
	if (!iso) return '';
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return '';
	const pad = (n: number) => n.toString().padStart(2, '0');
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
		d.getHours(),
	)}:${pad(d.getMinutes())}`;
}

function fromLocalDateTimeInput(value: string): string | null {
	if (!value) return null;
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) return null;
	return parsed.toISOString();
}

export function Admin() {
	const { user } = useAuth();
	const [date, setDate] = useState(today());
	const [employees, setEmployees] = useState<UserProfile[]>([]);
	const [summaries, setSummaries] = useState<DailySummary[]>([]);
	const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
	const [sessions, setSessions] = useState<AttendanceRecord[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [editing, setEditing] = useState<AttendanceRecord | null>(null);
	const [editTimeIn, setEditTimeIn] = useState('');
	const [editTimeOut, setEditTimeOut] = useState('');
	const [editBusy, setEditBusy] = useState(false);

	const loadReport = useCallback(async () => {
		if (!user) return;
		setLoading(true);
		setError(null);
		try {
			const [empResult, reportResult] = await Promise.all([
				fetchEmployees(user),
				fetchDailyReport(user, date),
			]);
			setEmployees(empResult.employees);
			setSummaries(reportResult.summaries);
		} catch (caught) {
			setError(caught instanceof Error ? caught.message : 'Unknown error');
		} finally {
			setLoading(false);
		}
	}, [user, date]);

	const loadSessionsForSelected = useCallback(async () => {
		if (!user || !selectedUserId) {
			setSessions([]);
			return;
		}
		try {
			const result = await fetchAdminAttendance(
				user,
				selectedUserId,
				date,
				date,
			);
			setSessions(result.sessions);
		} catch (caught) {
			setError(caught instanceof Error ? caught.message : 'Unknown error');
		}
	}, [user, selectedUserId, date]);

	useEffect(() => {
		void loadReport();
	}, [loadReport]);

	useEffect(() => {
		void loadSessionsForSelected();
	}, [loadSessionsForSelected]);

	function openEdit(record: AttendanceRecord) {
		setEditing(record);
		setEditTimeIn(toLocalDateTimeInput(record.timeIn));
		setEditTimeOut(toLocalDateTimeInput(record.timeOut));
	}

	async function saveEdit() {
		if (!user || !editing) return;
		setEditBusy(true);
		setError(null);
		try {
			const body: { timeIn?: string; timeOut?: string | null } = {};
			const newIn = fromLocalDateTimeInput(editTimeIn);
			if (newIn) body.timeIn = newIn;
			body.timeOut = editTimeOut ? fromLocalDateTimeInput(editTimeOut) : null;

			await adminUpdateAttendance(user, editing.id, body);
			setEditing(null);
			await Promise.all([loadReport(), loadSessionsForSelected()]);
		} catch (caught) {
			setError(caught instanceof Error ? caught.message : 'Unknown error');
		} finally {
			setEditBusy(false);
		}
	}

	const selectedEmployee = employees.find((e) => e.uid === selectedUserId);

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<h2 className="text-xl font-semibold text-zinc-900">Admin reports</h2>
					<p className="text-sm text-zinc-500">
						Daily metrics across all employees.
					</p>
				</div>
				<label className="block">
					<span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
						Report date
					</span>
					<input
						type="date"
						value={date}
						onChange={(e) => setDate(e.target.value)}
						className="mt-1 block rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
					/>
				</label>
			</div>

			{error ? (
				<p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
					{error}
				</p>
			) : null}

			{loading ? (
				<p className="text-sm text-zinc-500">Loading report...</p>
			) : (
				<ReportTable employees={employees} summaries={summaries} />
			)}

			<section className="space-y-3">
				<div className="flex flex-wrap items-end gap-3">
					<label className="block">
						<span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
							Inspect employee
						</span>
						<select
							className="mt-1 block rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
							value={selectedUserId ?? ''}
							onChange={(e) => setSelectedUserId(e.target.value || null)}
						>
							<option value="">Select…</option>
							{employees.map((e) => (
								<option key={e.uid} value={e.uid}>
									{e.name} ({e.email})
								</option>
							))}
						</select>
					</label>
					{selectedEmployee ? (
						<p className="text-sm text-zinc-500">
							Schedule {selectedEmployee.schedule.start} –{' '}
							{selectedEmployee.schedule.end} · {selectedEmployee.timezone}
						</p>
					) : null}
				</div>

				{selectedUserId ? (
					<AttendanceTable
						records={sessions}
						timezone={selectedEmployee?.timezone}
						emptyMessage="No sessions on this date for the selected employee."
						onEdit={openEdit}
					/>
				) : null}
			</section>

			{editing ? (
				<div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 px-4">
					<div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
						<h3 className="text-lg font-semibold text-zinc-900">Edit punch</h3>
						<p className="mt-1 text-xs text-zinc-500">
							Session ID: {editing.id}
						</p>

						<label className="mt-4 block">
							<span className="text-sm font-medium text-zinc-700">Time in</span>
							<input
								type="datetime-local"
								value={editTimeIn}
								onChange={(e) => setEditTimeIn(e.target.value)}
								className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
							/>
						</label>

						<label className="mt-3 block">
							<span className="text-sm font-medium text-zinc-700">
								Time out (leave blank to keep active)
							</span>
							<input
								type="datetime-local"
								value={editTimeOut}
								onChange={(e) => setEditTimeOut(e.target.value)}
								className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
							/>
						</label>

						<div className="mt-6 flex justify-end gap-2">
							<button
								type="button"
								className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium transition hover:bg-zinc-100"
								onClick={() => setEditing(null)}
								disabled={editBusy}
							>
								Cancel
							</button>
							<button
								type="button"
								className="rounded-md bg-teal-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
								onClick={() => void saveEdit()}
								disabled={editBusy}
							>
								{editBusy ? 'Saving...' : 'Save'}
							</button>
						</div>
					</div>
				</div>
			) : null}
		</div>
	);
}
