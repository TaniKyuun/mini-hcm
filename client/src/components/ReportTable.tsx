import type { DailySummary, UserProfile } from '../types/api';
import { formatHours } from '../utils/formatTime';

type ReportTableProps = {
	employees: UserProfile[];
	summaries: DailySummary[];
};

export function ReportTable({ employees, summaries }: ReportTableProps) {
	const byUserId = new Map<string, DailySummary>();
	for (const s of summaries) {
		byUserId.set(s.userId, s);
	}

	if (employees.length === 0) {
		return (
			<p className="rounded-lg border border-dashed border-zinc-300 bg-white p-6 text-center text-sm text-zinc-500">
				No employees yet.
			</p>
		);
	}

	return (
		<div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
			<table className="min-w-full divide-y divide-zinc-200 text-sm">
				<thead className="bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
					<tr>
						<th className="px-4 py-3">Employee</th>
						<th className="px-4 py-3 text-right">Regular</th>
						<th className="px-4 py-3 text-right">OT</th>
						<th className="px-4 py-3 text-right">ND</th>
						<th className="px-4 py-3 text-right">Total</th>
						<th className="px-4 py-3 text-right">Late (m)</th>
						<th className="px-4 py-3 text-right">UT (m)</th>
						<th className="px-4 py-3 text-right">Sessions</th>
					</tr>
				</thead>
				<tbody className="divide-y divide-zinc-100 text-zinc-800">
					{employees.map((employee) => {
						const s = byUserId.get(employee.uid);
						return (
							<tr key={employee.uid}>
								<td className="px-4 py-3">
									<div className="font-medium">{employee.name}</div>
									<div className="text-xs text-zinc-500">{employee.email}</div>
								</td>
								<td className="px-4 py-3 text-right tabular-nums">
									{formatHours(s?.regularHours ?? 0)}
								</td>
								<td className="px-4 py-3 text-right tabular-nums">
									{formatHours(s?.overtimeHours ?? 0)}
								</td>
								<td className="px-4 py-3 text-right tabular-nums">
									{formatHours(s?.nightDifferentialHours ?? 0)}
								</td>
								<td className="px-4 py-3 text-right font-medium tabular-nums">
									{formatHours(s?.totalHours ?? 0)}
								</td>
								<td className="px-4 py-3 text-right tabular-nums">
									{s?.lateMinutes ?? 0}
								</td>
								<td className="px-4 py-3 text-right tabular-nums">
									{s?.undertimeMinutes ?? 0}
								</td>
								<td className="px-4 py-3 text-right tabular-nums">
									{s?.sessionsCount ?? 0}
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
}
