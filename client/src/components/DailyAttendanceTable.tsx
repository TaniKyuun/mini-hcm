import { ArrowRightIcon, InfoIcon } from 'lucide-react';
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
import type { DailySummary } from '@/types/api';
import {
	formatDate,
	formatHoursAndMinutes,
	formatMinutes,
	formatTimeOnly,
} from '@/utils/formatTime';

type DailyAttendanceTableProps = {
	days: DailySummary[];
	timezone?: string;
	emptyMessage?: string;
	onViewDetails?: (day: DailySummary) => void;
};

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

function StatusCell({ sessionsCount }: { sessionsCount: number }) {
	if (sessionsCount === 0) {
		return (
			<TableCell>
				<Badge variant="outline" className="text-muted-foreground">
					no punches
				</Badge>
			</TableCell>
		);
	}
	if (sessionsCount > 1) {
		return (
			<TableCell>
				<Badge variant="secondary">{sessionsCount} sessions · completed</Badge>
			</TableCell>
		);
	}
	return (
		<TableCell>
			<Badge variant="secondary">completed</Badge>
		</TableCell>
	);
}

export function DailyAttendanceTable({
	days,
	timezone,
	emptyMessage = 'No activity in this range.',
	onViewDetails,
}: DailyAttendanceTableProps) {
	const hasAction = Boolean(onViewDetails);

	if (days.length === 0) {
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
								hint="Regular + Overtime + Night differential, summed across the day's sessions."
							/>
							<TableHead>Status</TableHead>
							{hasAction ? <TableHead className="text-right" /> : null}
						</TableRow>
					</TableHeader>
					<TableBody>
						{days.map((day) => {
							const isEmpty = day.sessionsCount === 0;
							return (
								<TableRow key={day.date}>
									<TableCell className="font-medium">
										{formatDate(day.date)}
									</TableCell>
									<TableCell
										className={cn(
											'font-mono tabular-nums',
											!day.firstTimeIn && 'text-muted-foreground/50',
										)}
									>
										{day.firstTimeIn
											? formatTimeOnly(day.firstTimeIn, timezone)
											: '-'}
									</TableCell>
									<TableCell
										className={cn(
											'font-mono tabular-nums',
											!day.lastTimeOut && 'text-muted-foreground/50',
										)}
									>
										{day.lastTimeOut
											? formatTimeOnly(day.lastTimeOut, timezone)
											: '-'}
									</TableCell>
									<HoursCell hours={day.regularHours} />
									<HoursCell hours={day.overtimeHours} tone="primary" />
									<HoursCell hours={day.nightDifferentialHours} tone="night" />
									<MinutesCell minutes={day.lateMinutes} tone="warn" />
									<TableCell
										className={cn(
											'text-right font-mono font-semibold tabular-nums',
											day.totalHours <= 0 && 'text-muted-foreground/50',
										)}
									>
										{day.totalHours <= 0
											? '-'
											: formatHoursAndMinutes(day.totalHours)}
									</TableCell>
									<StatusCell sessionsCount={day.sessionsCount} />
									{hasAction && onViewDetails ? (
										<TableCell className="text-right">
											<Button
												variant="outline"
												size="xs"
												disabled={isEmpty}
												onClick={() => onViewDetails(day)}
											>
												View details
												<ArrowRightIcon />
											</Button>
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
