import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import type { DailySummary, UserProfile } from '@/types/api';
import { formatHours } from '@/utils/formatTime';

type ReportTableProps = {
	employees: UserProfile[];
	summaries: DailySummary[];
};

function getInitials(name: string): string {
	const parts = name.trim().split(/\s+/);
	if (parts.length === 0) return '··';
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ReportTable({ employees, summaries }: ReportTableProps) {
	const byUserId = new Map<string, DailySummary>();
	for (const s of summaries) {
		byUserId.set(s.userId, s);
	}

	if (employees.length === 0) {
		return (
			<div className="w-full">
				<div className="rounded-sm border bg-card px-4 py-12 text-center text-sm text-muted-foreground">
					No employees yet.
				</div>
			</div>
		);
	}

	return (
		<div className="w-full">
			<div className="[&>div]:rounded-sm [&>div]:border">
				<Table>
					<TableHeader>
						<TableRow className="hover:bg-transparent">
							<TableHead>Name</TableHead>
							<TableHead>Email</TableHead>
							<TableHead className="text-right">Regular</TableHead>
							<TableHead className="text-right">OT</TableHead>
							<TableHead className="text-right">ND</TableHead>
							<TableHead className="text-right">Total</TableHead>
							<TableHead className="text-right">Late (m)</TableHead>
							<TableHead className="text-right">UT (m)</TableHead>
							<TableHead className="text-right">Sessions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{employees.map((employee) => {
							const s = byUserId.get(employee.uid);
							return (
								<TableRow key={employee.uid}>
									<TableCell>
										<div className="flex items-center gap-3">
											<Avatar>
												<AvatarFallback className="text-xs">
													{getInitials(employee.name)}
												</AvatarFallback>
											</Avatar>
											<div className="font-medium">{employee.name}</div>
										</div>
									</TableCell>
									<TableCell className="text-muted-foreground">
										{employee.email}
									</TableCell>
									<TableCell className="text-right font-mono tabular-nums">
										{formatHours(s?.regularHours ?? 0)}
									</TableCell>
									<TableCell className="text-right font-mono tabular-nums">
										{formatHours(s?.overtimeHours ?? 0)}
									</TableCell>
									<TableCell className="text-right font-mono tabular-nums">
										{formatHours(s?.nightDifferentialHours ?? 0)}
									</TableCell>
									<TableCell className="text-right font-mono font-semibold tabular-nums">
										{formatHours(s?.totalHours ?? 0)}
									</TableCell>
									<TableCell className="text-right font-mono tabular-nums">
										{s?.lateMinutes ?? 0}
									</TableCell>
									<TableCell className="text-right font-mono tabular-nums">
										{s?.undertimeMinutes ?? 0}
									</TableCell>
									<TableCell className="text-right font-mono tabular-nums">
										{s?.sessionsCount ?? 0}
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
