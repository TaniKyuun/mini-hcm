import { ChevronDownIcon, InfoIcon, Trash2Icon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
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
import type { AttendanceRecord, UserProfile } from '@/types/api';
import { isoToDate } from '@/utils/dateIso';
import { initialsOf } from '@/utils/employeeMock';
import {
	formatDate,
	formatDateTime,
	formatHoursAndMinutes,
} from '@/utils/formatTime';

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
): string | undefined {
	if (!date) return undefined;
	const [hStr = '0', mStr = '0', sStr = '0'] = time.split(':');
	const h = parseInt(hStr, 10) || 0;
	const m = parseInt(mStr, 10) || 0;
	const s = parseInt(sStr, 10) || 0;
	const out = new Date(date);
	out.setHours(h, m, s, 0);
	return out.toISOString();
}

type EditPunchModalProps = {
	open: boolean;
	record: AttendanceRecord | null;
	employee?: UserProfile | null;
	busy?: boolean;
	error?: string | null;
	onOpenChange: (open: boolean) => void;
	onSave: (body: {
		timeIn?: string;
		timeOut?: string | null;
		reason?: string;
		notify?: boolean;
	}) => void;
};

export function EditPunchModal({
	open,
	record,
	employee,
	busy,
	error,
	onOpenChange,
	onSave,
}: EditPunchModalProps) {
	const [dateIn, setDateIn] = useState<Date | undefined>(undefined);
	const [timeIn, setTimeIn] = useState('');
	const [dateOut, setDateOut] = useState<Date | undefined>(undefined);
	const [timeOut, setTimeOut] = useState('');
	const [reason, setReason] = useState('');
	const [notify, setNotify] = useState(true);
	const [dateInOpen, setDateInOpen] = useState(false);
	const [dateOutOpen, setDateOutOpen] = useState(false);

	useEffect(() => {
		if (!record) return;
		setDateIn(isoToDate(record.timeIn));
		setTimeIn(isoToTime(record.timeIn));
		setDateOut(isoToDate(record.timeOut));
		setTimeOut(isoToTime(record.timeOut));
		setReason('');
		setNotify(true);
	}, [record]);

	if (!record) {
		return (
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent />
			</Dialog>
		);
	}

	const lateMinutes = record.computed?.lateMinutes ?? 0;
	const regularHours = record.computed?.regularHours ?? 0;
	const originalTimeIn = record.timeIn
		? new Date(record.timeIn).toLocaleTimeString(undefined, {
				hour: '2-digit',
				minute: '2-digit',
			})
		: '—';
	const isEdited = Boolean(
		record.createdAt &&
			record.updatedAt &&
			new Date(record.updatedAt).getTime() -
				new Date(record.createdAt).getTime() >
				60_000,
	);

	function handleSave() {
		const inIso = combineDateAndTime(dateIn, timeIn);
		const outIso = dateOut ? combineDateAndTime(dateOut, timeOut) : null;
		onSave({
			timeIn: inIso,
			timeOut: outIso,
			reason: reason.trim() || undefined,
			notify,
		});
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-135">
				<DialogHeader>
					<Avatar className="size-9 rounded-lg bg-foreground text-background">
						<AvatarFallback className="rounded-lg bg-foreground text-background text-xs font-semibold">
							{initialsOf(employee?.name ?? '··')}
						</AvatarFallback>
					</Avatar>
					<div className="flex-1">
						<DialogTitle>
							Edit punch — {employee?.name ?? 'Employee'}
						</DialogTitle>
						<DialogDescription>{formatDate(record.date)}</DialogDescription>
					</div>
				</DialogHeader>

				<DialogBody>
					{lateMinutes > 0 ? (
						<div className="flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
							<InfoIcon className="size-3.5 shrink-0" />
							<span>
								<b>Late by {lateMinutes}m</b> — original punch {originalTimeIn}.
								Adjust below if needed.
							</span>
						</div>
					) : null}

					<div className="flex flex-col gap-3">
						<Label>Clock in</Label>
						<div className="flex gap-2">
							<Popover open={dateInOpen} onOpenChange={setDateInOpen}>
								<PopoverTrigger
									render={
										<Button
											variant="outline"
											id="punch-in-date"
											className="flex-1 justify-between font-normal"
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
								id="punch-in-time"
								step="1"
								value={timeIn}
								onChange={(e) => setTimeIn(e.target.value)}
								className="w-32 bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
							/>
						</div>
					</div>

					<div className="flex flex-col gap-3">
						<Label>Clock out</Label>
						<div className="flex gap-2">
							<Popover open={dateOutOpen} onOpenChange={setDateOutOpen}>
								<PopoverTrigger
									render={
										<Button
											variant="outline"
											id="punch-out-date"
											className="flex-1 justify-between font-normal"
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
								id="punch-out-time"
								step="1"
								value={timeOut}
								onChange={(e) => setTimeOut(e.target.value)}
								placeholder="not yet"
								className="w-32 bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
							/>
						</div>
						<p className="text-xs text-muted-foreground">
							Leave date empty to keep this session active.
						</p>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="punch-hours">Hours</Label>
							<Input
								id="punch-hours"
								value={`auto · ${formatHoursAndMinutes(regularHours)}`}
								disabled
								className="font-mono text-xs"
							/>
						</div>
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="punch-late">Late</Label>
							<Input
								id="punch-late"
								value={`${lateMinutes}m`}
								disabled
								className="font-mono text-xs"
							/>
						</div>
					</div>

					<div className="flex flex-col gap-1.5">
						<Label htmlFor="punch-reason">Reason for change</Label>
						<Input
							id="punch-reason"
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							placeholder="e.g. Train delay (approved by manager)"
						/>
					</div>

					<div className="rounded-md border border-dashed bg-muted/30 p-3">
						<div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
							Audit
						</div>
						<div className="mt-1.5 font-mono text-[11px] leading-relaxed text-muted-foreground">
							<div>
								Created · {formatDateTime(record.createdAt)} · session{' '}
								{record.id.slice(0, 8)}
							</div>
							<div>
								{isEdited ? 'Last edited · ' : 'No edits · '}
								{formatDateTime(record.updatedAt)}
							</div>
							<div>
								Original · in {originalTimeIn}
								{record.timeOut
									? ` → out ${new Date(record.timeOut).toLocaleTimeString(
											undefined,
											{ hour: '2-digit', minute: '2-digit' },
										)}`
									: ' → (open)'}
							</div>
						</div>
					</div>

					<label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
						<Checkbox
							checked={notify}
							onCheckedChange={(v) => setNotify(Boolean(v))}
						/>
						Notify employee of this edit
					</label>

					{error ? (
						<p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
							{error}
						</p>
					) : null}
				</DialogBody>

				<DialogFooter>
					<Button variant="destructive" size="sm" disabled={busy}>
						<Trash2Icon />
						Delete punch
					</Button>
					<div className="flex-1" />
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onOpenChange(false)}
						disabled={busy}
					>
						Cancel
					</Button>
					<Button size="sm" onClick={handleSave} disabled={busy}>
						{busy ? 'Saving…' : 'Save changes'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
