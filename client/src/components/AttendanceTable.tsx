import type { AttendanceRecord } from '../types/api';
import { formatDate, formatHours, formatTimeOnly } from '../utils/formatTime';

type AttendanceTableProps = {
	records: AttendanceRecord[];
	timezone?: string;
	emptyMessage?: string;
	onEdit?: (record: AttendanceRecord) => void;
};

export function AttendanceTable({
	records,
	timezone,
	emptyMessage = 'No attendance records.',
	onEdit,
}: AttendanceTableProps) {
	if (records.length === 0) {
		return (
			<p className="rounded-lg border border-dashed border-zinc-300 bg-white p-6 text-center text-sm text-zinc-500">
				{emptyMessage}
			</p>
		);
	}

	return (
		<div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
			<table className="min-w-full divide-y divide-zinc-200 text-sm">
				<thead className="bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
					<tr>
						<th className="px-4 py-3">Date</th>
						<th className="px-4 py-3">In</th>
						<th className="px-4 py-3">Out</th>
						<th className="px-4 py-3 text-right">Regular</th>
						<th className="px-4 py-3 text-right">OT</th>
						<th className="px-4 py-3 text-right">ND</th>
						<th className="px-4 py-3 text-right">Late (m)</th>
						<th className="px-4 py-3">Status</th>
						{onEdit ? <th className="px-4 py-3" /> : null}
					</tr>
				</thead>
				<tbody className="divide-y divide-zinc-100 text-zinc-800">
					{records.map((record) => (
						<tr key={record.id}>
							<td className="px-4 py-3 whitespace-nowrap">
								{formatDate(record.date)}
							</td>
							<td className="px-4 py-3 whitespace-nowrap tabular-nums">
								{formatTimeOnly(record.timeIn, timezone)}
							</td>
							<td className="px-4 py-3 whitespace-nowrap tabular-nums">
								{formatTimeOnly(record.timeOut, timezone)}
							</td>
							<td className="px-4 py-3 text-right tabular-nums">
								{formatHours(record.computed?.regularHours ?? 0)}
							</td>
							<td className="px-4 py-3 text-right tabular-nums">
								{formatHours(record.computed?.overtimeHours ?? 0)}
							</td>
							<td className="px-4 py-3 text-right tabular-nums">
								{formatHours(record.computed?.nightDifferentialHours ?? 0)}
							</td>
							<td className="px-4 py-3 text-right tabular-nums">
								{record.computed?.lateMinutes ?? 0}
							</td>
							<td className="px-4 py-3 whitespace-nowrap">
								<span
									className={
										record.status === 'active'
											? 'inline-flex items-center rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700'
											: 'inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700'
									}
								>
									{record.status}
								</span>
							</td>
							{onEdit ? (
								<td className="px-4 py-3 text-right">
									<button
										type="button"
										className="text-sm font-medium text-teal-700 hover:underline"
										onClick={() => onEdit(record)}
									>
										Edit
									</button>
								</td>
							) : null}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
