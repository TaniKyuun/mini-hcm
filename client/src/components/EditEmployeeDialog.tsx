import { PencilIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
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
import { cn } from '@/lib/utils';
import type { AdminUpdateProfileBody } from '@/services/adminService';
import type {
	EmploymentType,
	UserLocation,
	UserProfile,
	UserRole,
} from '@/types/api';
import { initialsOf } from '@/utils/employeeMock';
import {
	hasErrors,
	validateEmail,
	validateName,
	validateSchedule,
	validateTimezone,
} from '@/utils/validateProfile';
import {
	DAY_LABELS,
	DEFAULT_WORKING_DAYS,
	effectiveWorkingDays,
} from '@/utils/workingDays';

const ROLES: UserRole[] = ['employee', 'admin'];
const EMPLOYMENT_TYPES: EmploymentType[] = [
	'Full-time',
	'Part-time',
	'Contractual',
];
const LOCATIONS: UserLocation[] = ['On-Site', 'Remote', 'Hybrid'];

type EditEmployeeDialogProps = {
	open: boolean;
	employee: UserProfile | null;
	busy?: boolean;
	error?: string | null;
	onOpenChange: (open: boolean) => void;
	onSave: (body: AdminUpdateProfileBody) => void;
};

export function EditEmployeeDialog({
	open,
	employee,
	busy,
	error,
	onOpenChange,
	onSave,
}: EditEmployeeDialogProps) {
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [role, setRole] = useState<UserRole>('employee');
	const [timezone, setTimezone] = useState('Asia/Manila');
	const [startTime, setStartTime] = useState('09:00');
	const [endTime, setEndTime] = useState('18:00');
	const [employmentType, setEmploymentType] = useState<EmploymentType | ''>('');
	const [location, setLocation] = useState<UserLocation | ''>('');
	const [workingDays, setWorkingDays] = useState<number[]>([
		...DEFAULT_WORKING_DAYS,
	]);

	useEffect(() => {
		if (!employee || !open) return;
		setName(employee.name);
		setEmail(employee.email);
		setRole(employee.role);
		setTimezone(employee.timezone);
		setStartTime(employee.schedule.start);
		setEndTime(employee.schedule.end);
		setEmploymentType(employee.employmentType ?? '');
		setLocation(employee.location ?? '');
		setWorkingDays(effectiveWorkingDays(employee.schedule));
	}, [employee, open]);

	function toggleWorkingDay(day: number) {
		setWorkingDays((prev) =>
			prev.includes(day)
				? prev.filter((d) => d !== day)
				: [...prev, day].sort((a, b) => a - b),
		);
	}

	const fieldErrors = useMemo(
		() => ({
			name: validateName(name) ?? undefined,
			email: validateEmail(email) ?? undefined,
			timezone: validateTimezone(timezone) ?? undefined,
			...validateSchedule(startTime, endTime, workingDays),
		}),
		[name, email, timezone, startTime, endTime, workingDays],
	);
	const formInvalid = hasErrors(fieldErrors);

	function handleSave() {
		if (formInvalid) return;
		const body: AdminUpdateProfileBody = {
			name: name.trim(),
			email: email.trim(),
			role,
			timezone: timezone.trim(),
			schedule: {
				start: startTime,
				end: endTime,
				workingDays: [...workingDays].sort((a, b) => a - b),
			},
		};
		if (employmentType) body.employmentType = employmentType;
		if (location) body.location = location;
		onSave(body);
	}

	if (!employee) {
		return (
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent />
			</Dialog>
		);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-135">
				<DialogHeader>
					<Avatar className="size-9 rounded-lg bg-foreground text-background">
						<AvatarFallback className="rounded-lg bg-foreground text-background text-xs font-semibold">
							{initialsOf(employee.name)}
						</AvatarFallback>
					</Avatar>
					<div className="flex-1">
						<DialogTitle>Edit profile - {employee.name}</DialogTitle>
						<DialogDescription>
							Update role, schedule, and employment details.
						</DialogDescription>
					</div>
				</DialogHeader>

				<DialogBody>
					<div className="grid grid-cols-2 gap-3">
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="edit-name">Full name</Label>
							<Input
								id="edit-name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								aria-invalid={Boolean(fieldErrors.name)}
								className={cn(fieldErrors.name && 'border-destructive')}
							/>
							{fieldErrors.name ? (
								<p className="text-[11px] text-destructive">
									{fieldErrors.name}
								</p>
							) : null}
						</div>
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="edit-email">Email</Label>
							<Input
								id="edit-email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								aria-invalid={Boolean(fieldErrors.email)}
								className={cn(fieldErrors.email && 'border-destructive')}
							/>
							{fieldErrors.email ? (
								<p className="text-[11px] text-destructive">
									{fieldErrors.email}
								</p>
							) : null}
						</div>
					</div>

					<div className="flex flex-col gap-2">
						<Label>Role</Label>
						<div className="flex flex-wrap gap-2">
							{ROLES.map((r) => (
								<Button
									key={r}
									type="button"
									variant={role === r ? 'default' : 'outline'}
									size="sm"
									onClick={() => setRole(r)}
									className="capitalize"
								>
									{r}
								</Button>
							))}
						</div>
					</div>

					<div className="flex flex-col gap-1.5">
						<Label htmlFor="edit-tz">Timezone</Label>
						<Input
							id="edit-tz"
							value={timezone}
							onChange={(e) => setTimezone(e.target.value)}
							aria-invalid={Boolean(fieldErrors.timezone)}
							className={cn(fieldErrors.timezone && 'border-destructive')}
						/>
						{fieldErrors.timezone ? (
							<p className="text-[11px] text-destructive">
								{fieldErrors.timezone}
							</p>
						) : null}
					</div>

					<div className="flex flex-col gap-2">
						<Label>Working days</Label>
						<div className="flex flex-wrap gap-1.5">
							{DAY_LABELS.map((label, idx) => (
								<Button
									// biome-ignore lint/suspicious/noArrayIndexKey: day-of-week index is the natural key
									key={idx}
									type="button"
									variant={workingDays.includes(idx) ? 'default' : 'outline'}
									size="xs"
									onClick={() => toggleWorkingDay(idx)}
									aria-pressed={workingDays.includes(idx)}
									aria-label={`Toggle ${label}`}
								>
									{label}
								</Button>
							))}
						</div>
						{fieldErrors['schedule.workingDays'] ? (
							<p className="text-[11px] text-destructive">
								{fieldErrors['schedule.workingDays']}
							</p>
						) : null}
					</div>

					<div className="flex flex-col gap-2">
						<Label>Shift</Label>
						<div className="flex items-center gap-2">
							<Input
								type="time"
								value={startTime}
								onChange={(e) => setStartTime(e.target.value)}
								aria-invalid={Boolean(fieldErrors['schedule.start'])}
								className={cn(
									'w-32 bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden',
									fieldErrors['schedule.start'] && 'border-destructive',
								)}
							/>
							<span className="text-xs text-muted-foreground">to</span>
							<Input
								type="time"
								value={endTime}
								onChange={(e) => setEndTime(e.target.value)}
								aria-invalid={Boolean(fieldErrors['schedule.end'])}
								className={cn(
									'w-32 bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden',
									fieldErrors['schedule.end'] && 'border-destructive',
								)}
							/>
							<span className="ml-auto font-mono text-xs text-muted-foreground tabular-nums">
								{shiftSummary(startTime, endTime)}
							</span>
						</div>
						{fieldErrors['schedule.start'] ||
						fieldErrors['schedule.end'] ||
						fieldErrors.schedule ? (
							<p className="text-[11px] text-destructive">
								{fieldErrors['schedule.start'] ||
									fieldErrors['schedule.end'] ||
									fieldErrors.schedule}
							</p>
						) : null}
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div className="flex flex-col gap-2">
							<Label>Employment</Label>
							<div className="flex flex-wrap gap-1.5">
								{EMPLOYMENT_TYPES.map((t) => (
									<Button
										key={t}
										type="button"
										variant={employmentType === t ? 'default' : 'outline'}
										size="xs"
										onClick={() => setEmploymentType(t)}
									>
										{t}
									</Button>
								))}
							</div>
						</div>
						<div className="flex flex-col gap-2">
							<Label>Location</Label>
							<div className="flex flex-wrap gap-1.5">
								{LOCATIONS.map((l) => (
									<Button
										key={l}
										type="button"
										variant={location === l ? 'default' : 'outline'}
										size="xs"
										onClick={() => setLocation(l)}
									>
										{l}
									</Button>
								))}
							</div>
						</div>
					</div>

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
					<Button size="sm" onClick={handleSave} disabled={busy || formInvalid}>
						{busy ? (
							'Saving…'
						) : (
							<>
								<PencilIcon />
								Save changes
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function shiftSummary(start: string, end: string): string {
	const s = parseHM(start);
	const e = parseHM(end);
	if (s === null || e === null) return '';
	const diff = (e - s + 24 * 60) % (24 * 60);
	const h = Math.floor(diff / 60);
	const m = diff % 60;
	return `${h}h ${m}m`;
}

function parseHM(value: string): number | null {
	const match = /^(\d{2}):(\d{2})$/.exec(value);
	if (!match) return null;
	return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
}
