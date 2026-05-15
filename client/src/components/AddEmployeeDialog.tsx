import { UserPlusIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
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
import type { CreateEmployeeBody } from '@/services/adminService';
import type { EmploymentType, UserLocation, UserRole } from '@/types/api';
import {
	type FieldErrors,
	hasErrors,
	validateEmail,
	validateName,
	validatePassword,
	validateSchedule,
	validateTimezone,
} from '@/utils/validateProfile';
import { DAY_LABELS, DEFAULT_WORKING_DAYS } from '@/utils/workingDays';

const ROLES: UserRole[] = ['employee', 'admin'];
const EMPLOYMENT_TYPES: EmploymentType[] = [
	'Full-time',
	'Part-time',
	'Contractual',
];
const LOCATIONS: UserLocation[] = ['On-Site', 'Remote', 'Hybrid'];

type AddEmployeeDialogProps = {
	open: boolean;
	busy?: boolean;
	error?: string | null;
	onOpenChange: (open: boolean) => void;
	onSave: (body: CreateEmployeeBody) => void;
};

export function AddEmployeeDialog({
	open,
	busy,
	error,
	onOpenChange,
	onSave,
}: AddEmployeeDialogProps) {
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [role, setRole] = useState<UserRole>('employee');
	const [timezone, setTimezone] = useState('Asia/Manila');
	const [startTime, setStartTime] = useState('09:00');
	const [endTime, setEndTime] = useState('18:00');
	const [employmentType, setEmploymentType] = useState<EmploymentType | ''>(
		'Full-time',
	);
	const [location, setLocation] = useState<UserLocation | ''>('On-Site');
	const [workingDays, setWorkingDays] = useState<number[]>([
		...DEFAULT_WORKING_DAYS,
	]);
	const [showErrors, setShowErrors] = useState(false);

	useEffect(() => {
		if (open) {
			setName('');
			setEmail('');
			setPassword('');
			setRole('employee');
			setTimezone('Asia/Manila');
			setStartTime('09:00');
			setEndTime('18:00');
			setEmploymentType('Full-time');
			setLocation('On-Site');
			setWorkingDays([...DEFAULT_WORKING_DAYS]);
			setShowErrors(false);
		}
	}, [open]);

	const fieldErrors = {
		name: validateName(name) ?? undefined,
		email: validateEmail(email) ?? undefined,
		password: validatePassword(password) ?? undefined,
		timezone: validateTimezone(timezone) ?? undefined,
		...validateSchedule(startTime, endTime, workingDays),
	};
	const formInvalid = hasErrors(fieldErrors);

	function toggleWorkingDay(day: number) {
		setWorkingDays((prev) =>
			prev.includes(day)
				? prev.filter((d) => d !== day)
				: [...prev, day].sort((a, b) => a - b),
		);
	}

	function handleSave() {
		if (formInvalid) {
			setShowErrors(true);
			return;
		}
		onSave({
			name: name.trim(),
			email: email.trim(),
			password,
			role,
			timezone: timezone.trim(),
			schedule: {
				start: startTime,
				end: endTime,
				workingDays: [...workingDays].sort((a, b) => a - b),
			},
			employmentType: employmentType || undefined,
			location: location || undefined,
		});
	}

	// Show inline errors after the first save attempt or once the user moves on
	// from a field. The server error always shows immediately.
	const visibleErrors: FieldErrors = showErrors ? fieldErrors : {};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-135">
				<DialogHeader>
					<div className="flex size-9 items-center justify-center rounded-lg bg-foreground text-background">
						<UserPlusIcon className="size-4" />
					</div>
					<div className="flex-1">
						<DialogTitle>Add employee</DialogTitle>
						<DialogDescription>
							Creates a Firebase Auth account and HCM profile.
						</DialogDescription>
					</div>
				</DialogHeader>

				<DialogBody>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="add-name">Full name</Label>
						<Input
							id="add-name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Jane Doe"
							autoComplete="off"
							aria-invalid={Boolean(visibleErrors.name)}
							className={cn(visibleErrors.name && 'border-destructive')}
						/>
						{visibleErrors.name ? (
							<p className="text-[11px] text-destructive">
								{visibleErrors.name}
							</p>
						) : null}
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="add-email">Email</Label>
							<Input
								id="add-email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="jane@company.com"
								autoComplete="off"
								aria-invalid={Boolean(visibleErrors.email)}
								className={cn(visibleErrors.email && 'border-destructive')}
							/>
							{visibleErrors.email ? (
								<p className="text-[11px] text-destructive">
									{visibleErrors.email}
								</p>
							) : null}
						</div>
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="add-password">Temporary password</Label>
							<Input
								id="add-password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="min 8 chars"
								autoComplete="new-password"
								aria-invalid={Boolean(visibleErrors.password)}
								className={cn(visibleErrors.password && 'border-destructive')}
							/>
							{visibleErrors.password ? (
								<p className="text-[11px] text-destructive">
									{visibleErrors.password}
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
						<Label htmlFor="add-tz">Timezone</Label>
						<Input
							id="add-tz"
							value={timezone}
							onChange={(e) => setTimezone(e.target.value)}
							placeholder="Asia/Manila"
							aria-invalid={Boolean(visibleErrors.timezone)}
							className={cn(visibleErrors.timezone && 'border-destructive')}
						/>
						{visibleErrors.timezone ? (
							<p className="text-[11px] text-destructive">
								{visibleErrors.timezone}
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
						{visibleErrors['schedule.workingDays'] ? (
							<p className="text-[11px] text-destructive">
								{visibleErrors['schedule.workingDays']}
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
								aria-invalid={Boolean(visibleErrors['schedule.start'])}
								className={cn(
									'w-32 bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden',
									visibleErrors['schedule.start'] && 'border-destructive',
								)}
							/>
							<span className="text-xs text-muted-foreground">to</span>
							<Input
								type="time"
								value={endTime}
								onChange={(e) => setEndTime(e.target.value)}
								aria-invalid={Boolean(visibleErrors['schedule.end'])}
								className={cn(
									'w-32 bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden',
									visibleErrors['schedule.end'] && 'border-destructive',
								)}
							/>
							<span className="ml-auto font-mono text-xs text-muted-foreground tabular-nums">
								{shiftSummary(startTime, endTime)}
							</span>
						</div>
						{visibleErrors['schedule.start'] ||
						visibleErrors['schedule.end'] ||
						visibleErrors.schedule ? (
							<p className="text-[11px] text-destructive">
								{visibleErrors['schedule.start'] ||
									visibleErrors['schedule.end'] ||
									visibleErrors.schedule}
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
					<Button
						size="sm"
						onClick={handleSave}
						disabled={busy || (showErrors && formInvalid)}
					>
						{busy ? 'Creating…' : 'Create employee'}
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
