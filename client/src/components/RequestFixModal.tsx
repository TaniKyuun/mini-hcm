import { ChevronDownIcon, InfoIcon, SendIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
	Dialog,
	DialogBody,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { CreateEditRequestBody } from '@/services/editRequestService';
import type { AttendanceRecord } from '@/types/api';
import { isoToDate } from '@/utils/dateIso';
import { initialsOf } from '@/utils/employeeMock';
import { formatDate, formatTimeOnly } from '@/utils/formatTime';

const TIME_REGEX = /^\d{2}:\d{2}(:\d{2})?$/;
const REASON_MAX_LENGTH = 500;

type Errors = {
	timeIn?: string;
	timeOut?: string;
	reason?: string;
	form?: string;
};

function isoToTime(iso: string | null): string {
	if (!iso) return '';
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return '';
	const pad = (n: number) => n.toString().padStart(2, '0');
	return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function combineDateAndTime(
	date: Date | undefined,
	time: string,
): string | null {
	if (!date) return null;
	const [hStr = '0', mStr = '0', sStr = '0'] = time.split(':');
	const h = parseInt(hStr, 10) || 0;
	const m = parseInt(mStr, 10) || 0;
	const s = parseInt(sStr, 10) || 0;
	const out = new Date(date);
	out.setHours(h, m, s, 0);
	return out.toISOString();
}

type RequestFixModalProps = {
	open: boolean;
	record: AttendanceRecord | null;
	employeeName?: string;
	timezone?: string;
	busy?: boolean;
	error?: string | null;
	onOpenChange: (open: boolean) => void;
	onSubmit: (body: CreateEditRequestBody) => void;
};

export function RequestFixModal({
	open,
	record,
	employeeName,
	timezone,
	busy,
	error,
	onOpenChange,
	onSubmit,
}: RequestFixModalProps) {
	const [dateIn, setDateIn] = useState<Date | undefined>(undefined);
	const [timeIn, setTimeIn] = useState('');
	const [dateOut, setDateOut] = useState<Date | undefined>(undefined);
	const [timeOut, setTimeOut] = useState('');
	const [reason, setReason] = useState('');
	const [dateInOpen, setDateInOpen] = useState(false);
	const [dateOutOpen, setDateOutOpen] = useState(false);

	useEffect(() => {
		if (!record) return;
		setDateIn(isoToDate(record.timeIn));
		setTimeIn(isoToTime(record.timeIn));
		setDateOut(isoToDate(record.timeOut));
		setTimeOut(isoToTime(record.timeOut));
		setReason('');
	}, [record]);

	const errors = useMemo<Errors>(() => {
		const e: Errors = {};
		if (!record) return e;

		// timeIn: optional change — but if user picked a date, time must be valid
		if (dateIn && (!timeIn || !TIME_REGEX.test(timeIn))) {
			e.timeIn = 'Time must be HH:MM or HH:MM:SS.';
		}
		if (dateOut && (!timeOut || !TIME_REGEX.test(timeOut))) {
			e.timeOut = 'Time must be HH:MM or HH:MM:SS.';
		}

		// Detect "did the user actually change anything?"
		const proposedIn = combineDateAndTime(dateIn, timeIn);
		const proposedOut = combineDateAndTime(dateOut, timeOut);
		const inChanged = proposedIn !== null && proposedIn !== record.timeIn;
		const outChanged = proposedOut !== null && proposedOut !== record.timeOut;
		if (!inChanged && !outChanged) {
			e.form = 'Change at least one of clock-in or clock-out.';
		}

		// Clock-out after clock-in when both present
		if (
			!e.timeIn &&
			!e.timeOut &&
			proposedIn &&
			proposedOut &&
			new Date(proposedOut) <= new Date(proposedIn)
		) {
			e.timeOut = 'Clock-out must be after clock-in.';
		}

		if (!reason.trim()) {
			e.reason = 'Required.';
		} else if (reason.length > REASON_MAX_LENGTH) {
			e.reason = `Reason cannot exceed ${REASON_MAX_LENGTH} characters.`;
		}

		return e;
	}, [record, dateIn, timeIn, dateOut, timeOut, reason]);

	const formInvalid = Object.values(errors).some(Boolean);

	if (!record) {
		return (
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent />
			</Dialog>
		);
	}

	function handleSubmit() {
		if (formInvalid || !record) return;
		const proposedIn = combineDateAndTime(dateIn, timeIn);
		const proposedOut = combineDateAndTime(dateOut, timeOut);
		const body: CreateEditRequestBody = {
			attendanceId: record.id,
			reason: reason.trim(),
		};
		// Only include fields the employee actually changed.
		if (proposedIn !== null && proposedIn !== record.timeIn) {
			body.requestedTimeIn = proposedIn;
		}
		if (proposedOut !== null && proposedOut !== record.timeOut) {
			body.requestedTimeOut = proposedOut;
		}
		onSubmit(body);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-135">
				<DialogHeader>
					<Avatar className="size-9 rounded-lg bg-foreground text-background">
						<AvatarFallback className="rounded-lg bg-foreground text-background text-xs font-semibold">
							{initialsOf(employeeName ?? '··')}
						</AvatarFallback>
					</Avatar>
					<div className="flex-1">
						<DialogTitle>Request a fix</DialogTitle>
						<DialogDescription>{formatDate(record.date)}</DialogDescription>
					</div>
				</DialogHeader>

				<DialogBody>
					<div className="flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-foreground">
						<InfoIcon className="mt-0.5 size-3.5 shrink-0 text-primary" />
						<span>
							Propose new clock-in or clock-out times and explain the reason.
							An admin reviews each request before the change is applied to
							your record. Original times:{' '}
							<b>{formatTimeOnly(record.timeIn, timezone)}</b>
							{' → '}
							<b>
								{record.timeOut
									? formatTimeOnly(record.timeOut, timezone)
									: '(open)'}
							</b>
							.
						</span>
					</div>

					<div className="flex flex-col gap-3">
						<Label>Proposed clock in</Label>
						<div className="flex gap-2">
							<Popover open={dateInOpen} onOpenChange={setDateInOpen}>
								<PopoverTrigger
									render={
										<Button
											variant="outline"
											aria-invalid={Boolean(errors.timeIn)}
											className={cn(
												'flex-1 justify-between font-normal',
												errors.timeIn && 'border-destructive',
											)}
										/>
									}
								>
									{dateIn ? dateIn.toLocaleDateString() : 'Pick a date'}
									<ChevronDownIcon />
								</PopoverTrigger>
								<PopoverContent
									className="w-auto overflow-hidden p-0"
									align="start"
								>
									<Calendar
										mode="single"
										selected={dateIn}
										onSelect={(d) => {
											setDateIn(d);
											setDateInOpen(false);
										}}
									/>
								</PopoverContent>
							</Popover>
							<Input
								type="time"
								step="1"
								value={timeIn}
								onChange={(e) => setTimeIn(e.target.value)}
								aria-invalid={Boolean(errors.timeIn)}
								className={cn(
									'w-32 bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden',
									errors.timeIn && 'border-destructive',
								)}
							/>
						</div>
						{errors.timeIn ? (
							<p className="text-[11px] text-destructive">{errors.timeIn}</p>
						) : null}
					</div>

					<div className="flex flex-col gap-3">
						<Label>Proposed clock out</Label>
						<div className="flex gap-2">
							<Popover open={dateOutOpen} onOpenChange={setDateOutOpen}>
								<PopoverTrigger
									render={
										<Button
											variant="outline"
											aria-invalid={Boolean(errors.timeOut)}
											className={cn(
												'flex-1 justify-between font-normal',
												errors.timeOut && 'border-destructive',
											)}
										/>
									}
								>
									{dateOut ? dateOut.toLocaleDateString() : 'Pick a date'}
									<ChevronDownIcon />
								</PopoverTrigger>
								<PopoverContent
									className="w-auto overflow-hidden p-0"
									align="start"
								>
									<Calendar
										mode="single"
										selected={dateOut}
										onSelect={(d) => {
											setDateOut(d);
											setDateOutOpen(false);
										}}
									/>
								</PopoverContent>
							</Popover>
							<Input
								type="time"
								step="1"
								value={timeOut}
								onChange={(e) => setTimeOut(e.target.value)}
								aria-invalid={Boolean(errors.timeOut)}
								className={cn(
									'w-32 bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden',
									errors.timeOut && 'border-destructive',
								)}
							/>
						</div>
						{errors.timeOut ? (
							<p className="text-[11px] text-destructive">{errors.timeOut}</p>
						) : null}
					</div>

					<div className="flex flex-col gap-1.5">
						<Label htmlFor="request-reason">
							Reason
							<span className="ml-2 font-normal text-muted-foreground">
								{reason.length}/{REASON_MAX_LENGTH}
							</span>
						</Label>
						<Input
							id="request-reason"
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							placeholder="e.g. Forgot to clock out at 6:00 PM"
							aria-invalid={Boolean(errors.reason)}
							className={cn(errors.reason && 'border-destructive')}
						/>
						{errors.reason ? (
							<p className="text-[11px] text-destructive">{errors.reason}</p>
						) : null}
					</div>

					{errors.form ? (
						<p className="rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
							{errors.form}
						</p>
					) : null}

					{error ? (
						<p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
							{error}
						</p>
					) : null}
				</DialogBody>

				<DialogFooter>
					<div className="flex-1" />
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onOpenChange(false)}
						disabled={busy}
					>
						Cancel
					</Button>
					<Button
						size="sm"
						onClick={handleSubmit}
						disabled={busy || formInvalid}
					>
						{busy ? (
							'Submitting...'
						) : (
							<>
								<SendIcon />
								Submit request
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
