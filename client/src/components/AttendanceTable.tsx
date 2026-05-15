import { ArrowRightIcon, InfoIcon, PencilIcon } from 'lucide-react';
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
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { AttendanceRecord } from '@/types/api';
import {
	formatDate,
	formatHoursAndMinutes,
	formatMinutes,
	formatTimeOnly,
} from '@/utils/formatTime';

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

/**
 * Column header with a tooltip explaining the metric - `Regular`, `OT`, `ND`,
 * and `Late` are jargon to anyone outside payroll. The info icon stays
 * unobtrusive and the tooltip exposes the full definition on hover.
 */
function MetricHead({
	label,
	hint,
	className,
}: {
	label: string;
	hint: string;
	className?: string;
}) {
	return (
		<TableHead className={cn('text-right', className)}>
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger
						render={
							<button
								type="button"
								className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
							/>
						}
					>
						{label}
						<InfoIcon className="size-3" />
					</TooltipTrigger>
					<TooltipContent>{hint}</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		</TableHead>
	);
}

function HoursCell({
	hours,
	tone,
}: {
	hours: number;
	tone?: 'primary' | 'night' | 'warn';
}) {
	const isZero = !hours || hours <= 0;
	return (
		<TableCell
			className={cn(
				'text-right font-mono tabular-nums',
				isZero && 'text-muted-foreground/50',
				!isZero && tone === 'primary' && 'text-primary',
				!isZero && tone === 'night' && 'text-indigo-600 dark:text-indigo-400',
				!isZero && tone === 'warn' && 'text-amber-600 dark:text-amber-400',
			)}
		>
			{isZero ? '-' : formatHoursAndMinutes(hours)}
		</TableCell>
	);
}

function MinutesCell({ minutes, tone }: { minutes: number; tone?: 'warn' }) {
	const isZero = !minutes || minutes <= 0;
	return (
		<TableCell
			className={cn(
				'text-right font-mono tabular-nums',
				isZero && 'text-muted-foreground/50',
				!isZero && tone === 'warn' && 'text-amber-600 dark:text-amber-400',
			)}
		>
			{isZero ? '-' : formatMinutes(minutes)}
		</TableCell>
	);
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
							<MetricHead
								label="Regular"
								hint="Time worked inside the scheduled shift window."
							/>
							<MetricHead
								label="OT"
								hint="Overtime - time worked past the scheduled shift end."
							/>
							<MetricHead
								label="ND"
								hint="Night differential - hours between 22:00 and 06:00 local time."
							/>
							<MetricHead
								label="Late"
								hint="Minutes punched in after the scheduled shift start."
							/>
							<MetricHead
								label="Total"
								hint="Regular + Overtime + Night differential."
							/>
							<TableHead>Status</TableHead>
							{hasAction ? <TableHead className="text-right" /> : null}
						</TableRow>
					</TableHeader>
					<TableBody>
						{records.map((record) => {
							const reg = record.computed?.regularHours ?? 0;
							const ot = record.computed?.overtimeHours ?? 0;
							const nd = record.computed?.nightDifferentialHours ?? 0;
							const late = record.computed?.lateMinutes ?? 0;
							const total = reg + ot + nd;
							return (
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
									<HoursCell hours={reg} />
									<HoursCell hours={ot} tone="primary" />
									<HoursCell hours={nd} tone="night" />
									<MinutesCell minutes={late} tone="warn" />
									<TableCell
										className={cn(
											'text-right font-mono font-semibold tabular-nums',
											total <= 0 && 'text-muted-foreground/50',
										)}
									>
										{total <= 0 ? '-' : formatHoursAndMinutes(total)}
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
							);
						})}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
