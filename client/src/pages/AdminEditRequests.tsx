import { CheckIcon, ClockIcon, XIcon } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { fetchEmployees } from '@/services/adminService';
import {
	approveEditRequest,
	fetchAdminEditRequests,
	rejectEditRequest,
} from '@/services/editRequestService';
import type { EditRequest, EditRequestStatus, UserProfile } from '@/types/api';
import { initialsOf } from '@/utils/employeeMock';
import { formatDate, formatDateTime, formatTimeOnly } from '@/utils/formatTime';

const STATUS_FILTERS: Array<{ label: string; value?: EditRequestStatus }> = [
	{ label: 'Pending', value: 'pending' },
	{ label: 'Approved', value: 'approved' },
	{ label: 'Rejected', value: 'rejected' },
	{ label: 'All', value: undefined },
];

function statusBadge(status: EditRequestStatus) {
	if (status === 'pending') {
		return (
			<Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/15 dark:text-amber-400">
				● pending
			</Badge>
		);
	}
	if (status === 'approved') {
		return (
			<Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-400">
				approved
			</Badge>
		);
	}
	return <Badge variant="destructive">rejected</Badge>;
}

function timeLabel(iso: string | null, timezone?: string): string {
	if (!iso) return '(open)';
	return formatTimeOnly(iso, timezone);
}

export function AdminEditRequests() {
	const { user } = useAuth();
	const [requests, setRequests] = useState<EditRequest[]>([]);
	const [employees, setEmployees] = useState<UserProfile[]>([]);
	const [filter, setFilter] = useState<EditRequestStatus | undefined>(
		'pending',
	);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [actionBusyId, setActionBusyId] = useState<string | null>(null);
	const [actionError, setActionError] = useState<string | null>(null);
	const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

	const load = useCallback(
		async (signal?: AbortSignal) => {
			if (!user) return;
			setLoading(true);
			setError(null);
			try {
				const [reqResult, empResult] = await Promise.all([
					fetchAdminEditRequests(user, filter, signal),
					fetchEmployees(user, signal),
				]);
				setRequests(reqResult.editRequests);
				setEmployees(empResult.employees);
			} catch (caught) {
				if ((caught as { name?: string })?.name === 'AbortError') return;
				setError(caught instanceof Error ? caught.message : 'Unknown error');
			} finally {
				setLoading(false);
			}
		},
		[user, filter],
	);

	useEffect(() => {
		const controller = new AbortController();
		void load(controller.signal);
		return () => controller.abort();
	}, [load]);

	const employeesByUid = useMemo(
		() => new Map(employees.map((e) => [e.uid, e])),
		[employees],
	);

	async function handleApprove(id: string) {
		if (!user) return;
		setActionBusyId(id);
		setActionError(null);
		try {
			await approveEditRequest(user, id, adminNotes[id]);
			setAdminNotes((prev) => {
				const next = { ...prev };
				delete next[id];
				return next;
			});
			await load();
		} catch (caught) {
			setActionError(
				caught instanceof Error ? caught.message : 'Unknown error',
			);
		} finally {
			setActionBusyId(null);
		}
	}

	async function handleReject(id: string) {
		if (!user) return;
		setActionBusyId(id);
		setActionError(null);
		try {
			await rejectEditRequest(user, id, adminNotes[id]);
			setAdminNotes((prev) => {
				const next = { ...prev };
				delete next[id];
				return next;
			});
			await load();
		} catch (caught) {
			setActionError(
				caught instanceof Error ? caught.message : 'Unknown error',
			);
		} finally {
			setActionBusyId(null);
		}
	}

	const pendingCount = requests.filter((r) => r.status === 'pending').length;

	return (
		<div className="flex flex-col gap-4 px-4 lg:px-6">
			<div className="flex flex-wrap items-end justify-between gap-3">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight">
						Edit requests
					</h1>
					<p className="text-sm text-muted-foreground">
						Employee-submitted amendments to clock-in / clock-out times. Approve
						to apply, reject to dismiss - both notify the employee.
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					{STATUS_FILTERS.map((f) => (
						<Button
							key={f.label}
							variant={filter === f.value ? 'default' : 'outline'}
							size="sm"
							onClick={() => setFilter(f.value)}
						>
							{f.label}
							{f.value === 'pending' && pendingCount > 0 ? (
								<span className="ml-1 rounded bg-background/20 px-1.5 font-mono text-[10px]">
									{pendingCount}
								</span>
							) : null}
						</Button>
					))}
				</div>
			</div>

			{error ? (
				<p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
					{error}
				</p>
			) : null}
			{actionError ? (
				<p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
					{actionError}
				</p>
			) : null}

			{loading && requests.length === 0 ? (
				<Card className="px-6 py-12 text-center text-sm text-muted-foreground">
					Loading...
				</Card>
			) : requests.length === 0 ? (
				<Card className="px-6 py-12 text-center text-sm text-muted-foreground">
					No {filter ? filter : ''} edit requests.
				</Card>
			) : (
				<div className="flex flex-col gap-3">
					{requests.map((req) => {
						const employee = employeesByUid.get(req.requesterUid);
						const tz = employee?.timezone;
						const note = adminNotes[req.id] ?? '';
						const busy = actionBusyId === req.id;
						const isPending = req.status === 'pending';

						return (
							<Card key={req.id} className="gap-0 overflow-hidden p-0">
								<div className="flex flex-wrap items-center gap-3 border-b px-4 py-3">
									<Avatar className="size-8">
										<AvatarFallback className="text-xs">
											{initialsOf(employee?.name ?? '??')}
										</AvatarFallback>
									</Avatar>
									<div className="min-w-0 flex-1">
										<div className="truncate text-sm font-medium">
											{employee?.name ?? req.requesterUid}
										</div>
										<div className="truncate text-xs text-muted-foreground">
											{formatDate(req.date)}
										</div>
									</div>
									{statusBadge(req.status)}
									<span className="text-[10px] text-muted-foreground">
										<ClockIcon className="mr-1 inline size-3" />
										{formatDateTime(req.createdAt)}
									</span>
								</div>

								<div className="grid gap-3 px-4 py-3 @md/card:grid-cols-2">
									<div className="rounded-md border bg-muted/30 px-3 py-2">
										<div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
											Original
										</div>
										<div className="mt-1 font-mono text-sm">
											{timeLabel(req.originalTimeIn, tz)}
											{' → '}
											{timeLabel(req.originalTimeOut, tz)}
										</div>
									</div>
									<div
										className={cn(
											'rounded-md border px-3 py-2',
											isPending
												? 'border-primary/40 bg-primary/5'
												: 'bg-muted/30',
										)}
									>
										<div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
											Requested
										</div>
										<div className="mt-1 font-mono text-sm">
											{req.requestedTimeIn
												? timeLabel(req.requestedTimeIn, tz)
												: timeLabel(req.originalTimeIn, tz)}
											{' → '}
											{req.requestedTimeOut
												? timeLabel(req.requestedTimeOut, tz)
												: timeLabel(req.originalTimeOut, tz)}
										</div>
									</div>
								</div>

								<div className="border-t px-4 py-3">
									<div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
										Reason
									</div>
									<p className="mt-1 text-sm">{req.reason}</p>
								</div>

								{req.adminNote ? (
									<div className="border-t bg-muted/30 px-4 py-3">
										<div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
											Admin note
										</div>
										<p className="mt-1 text-sm">{req.adminNote}</p>
										{req.resolvedAt ? (
											<p className="mt-1 text-[10px] text-muted-foreground">
												{formatDateTime(req.resolvedAt)}
											</p>
										) : null}
									</div>
								) : null}

								{isPending ? (
									<div className="flex flex-col gap-2 border-t bg-muted/20 px-4 py-3">
										<div className="flex flex-col gap-1.5">
											<Label
												htmlFor={`note-${req.id}`}
												className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground"
											>
												Note to employee (optional)
											</Label>
											<Input
												id={`note-${req.id}`}
												value={note}
												onChange={(e) =>
													setAdminNotes({
														...adminNotes,
														[req.id]: e.target.value,
													})
												}
												placeholder="e.g. Applied your requested clock-out time."
												disabled={busy}
											/>
										</div>
										<div className="flex gap-2">
											<Button
												variant="outline"
												size="sm"
												className="flex-1 hover:bg-destructive/10 hover:text-destructive"
												onClick={() => void handleReject(req.id)}
												disabled={busy}
											>
												<XIcon />
												{busy ? 'Working...' : 'Reject'}
											</Button>
											<Button
												size="sm"
												className="flex-1"
												onClick={() => void handleApprove(req.id)}
												disabled={busy}
											>
												<CheckIcon />
												{busy ? 'Working...' : 'Approve & apply'}
											</Button>
										</div>
									</div>
								) : null}
							</Card>
						);
					})}
				</div>
			)}
		</div>
	);
}
