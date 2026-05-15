import { ArrowRightIcon, PencilIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import type { AttendanceRecord } from '@/types/api';
import { formatDate, formatHours, formatTimeOnly } from '@/utils/formatTime';

type AttendanceTableProps = {
	records: AttendanceRecord[];
	timezone?: string;
	emptyMessage?: string;
	onEdit?: (record: AttendanceRecord) => void;
	onViewDetails?: (record: AttendanceRecord) => void;
};

function StatusBadge({ status }: { status: AttendanceRecord['status'] }) {
	if (status === 'active') {
		return (
			<Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-400">
				● on shift
			</Badge>
		);
	}
	return <Badge variant="secondary">completed</Badge>;
}

export function AttendanceTable({
	records,
	timezone,
	emptyMessage = 'No attendance records.',
	onEdit,
	onViewDetails,
}: AttendanceTableProps) {
	const hasAction = Boolean(onEdit || onViewDetails);

	if (records.length === 0) {
		return (
			<div className="w-full">
				<div className="rounded-sm border bg-card px-4 py-12 text-center text-sm text-muted-foreground">
					{emptyMessage}
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
							<TableHead>Date</TableHead>
							<TableHead>Clock in</TableHead>
							<TableHead>Clock out</TableHead>
							<TableHead className="text-right">Regular</TableHead>
							<TableHead className="text-right">OT</TableHead>
							<TableHead className="text-right">ND</TableHead>
							<TableHead className="text-right">Late (m)</TableHead>
							<TableHead>Status</TableHead>
							{hasAction ? <TableHead className="text-right" /> : null}
						</TableRow>
					</TableHeader>
					<TableBody>
						{records.map((record) => (
							<TableRow key={record.id}>
								<TableCell className="font-medium">
									{formatDate(record.date)}
								</TableCell>
								<TableCell className="font-mono tabular-nums">
									{formatTimeOnly(record.timeIn, timezone)}
								</TableCell>
								<TableCell className="font-mono tabular-nums">
									{formatTimeOnly(record.timeOut, timezone)}
								</TableCell>
								<TableCell className="text-right font-mono tabular-nums">
									{formatHours(record.computed?.regularHours ?? 0)}
								</TableCell>
								<TableCell className="text-right font-mono tabular-nums">
									{formatHours(record.computed?.overtimeHours ?? 0)}
								</TableCell>
								<TableCell className="text-right font-mono tabular-nums">
									{formatHours(record.computed?.nightDifferentialHours ?? 0)}
								</TableCell>
								<TableCell className="text-right font-mono tabular-nums">
									{record.computed?.lateMinutes ?? 0}
								</TableCell>
								<TableCell>
									<StatusBadge status={record.status} />
								</TableCell>
								{hasAction ? (
									<TableCell className="text-right">
										{onEdit ? (
											<Button
												variant="outline"
												size="xs"
												onClick={() => onEdit(record)}
											>
												<PencilIcon />
												Edit
											</Button>
										) : null}
										{onViewDetails ? (
											<Button
												variant="outline"
												size="xs"
												onClick={() => onViewDetails(record)}
											>
												View details
												<ArrowRightIcon />
											</Button>
										) : null}
									</TableCell>
								) : null}
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
