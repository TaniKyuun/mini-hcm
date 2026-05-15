import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/lib/auth';
import { updateMe } from '@/services/attendanceService';
import { initialsOf } from '@/utils/employeeMock';
import { formatDate } from '@/utils/formatTime';

export function Profile() {
	const { user } = useAuth();
	const { profile, refresh } = useProfile();
	const [name, setName] = useState('');
	const [timezone, setTimezone] = useState('');
	const [scheduleStart, setScheduleStart] = useState('09:00');
	const [scheduleEnd, setScheduleEnd] = useState('18:00');
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [saved, setSaved] = useState(false);

	useEffect(() => {
		if (!profile) return;
		setName(profile.name);
		setTimezone(profile.timezone || '');
		setScheduleStart(profile.schedule.start || '09:00');
		setScheduleEnd(profile.schedule.end || '18:00');
	}, [profile]);

	async function handleSave() {
		if (!user || !profile) return;
		setBusy(true);
		setError(null);
		setSaved(false);
		try {
			await updateMe(user, {
				name: name.trim() || undefined,
				timezone: timezone.trim() || undefined,
				schedule: {
					start: scheduleStart,
					end: scheduleEnd,
				},
			});
			await refresh();
			setSaved(true);
		} catch (caught) {
			setError(caught instanceof Error ? caught.message : 'Unknown error');
		} finally {
			setBusy(false);
		}
	}

	const isAdmin = profile?.role === 'admin';

	return (
		<div className="flex flex-col gap-6 px-4 lg:px-6">
			<div>
				<h1 className="text-2xl font-semibold tracking-tight">My profile</h1>
				<p className="text-sm text-muted-foreground">
					Update your name, timezone, and default shift hours.
				</p>
			</div>

			<Card className="gap-0 p-0">
				<div className="flex items-center gap-4 border-b px-6 py-5">
					<Avatar className="size-14 rounded-lg bg-foreground text-background">
						<AvatarFallback className="rounded-lg bg-foreground text-background text-base font-semibold">
							{initialsOf(profile?.name ?? user?.email ?? '··')}
						</AvatarFallback>
					</Avatar>
					<div className="flex-1">
						<div className="text-lg font-semibold tracking-tight">
							{profile?.name ?? user?.email ?? 'You'}
						</div>
						<div className="text-xs text-muted-foreground">
							{profile?.email ?? user?.email}
						</div>
					</div>
					{isAdmin ? (
						<Badge className="bg-blue-500/15 text-blue-700 hover:bg-blue-500/15 dark:text-blue-400">
							admin
						</Badge>
					) : (
						<Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-400">
							● active
						</Badge>
					)}
				</div>

				<div className="flex flex-col gap-5 px-6 py-5">
					<div className="grid gap-4 md:grid-cols-2">
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="profile-name">Full name</Label>
							<Input
								id="profile-name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="Your name"
							/>
						</div>
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="profile-email">Email</Label>
							<Input
								id="profile-email"
								value={profile?.email ?? user?.email ?? ''}
								disabled
								className="font-mono text-xs"
							/>
						</div>
					</div>

					<div className="grid gap-4 md:grid-cols-3">
						<div className="flex flex-col gap-1.5 md:col-span-1">
							<Label htmlFor="profile-tz">Timezone</Label>
							<Input
								id="profile-tz"
								value={timezone}
								onChange={(e) => setTimezone(e.target.value)}
								placeholder="e.g. Asia/Manila"
							/>
						</div>
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="profile-start">Shift start</Label>
							<Input
								id="profile-start"
								type="time"
								value={scheduleStart}
								disabled
								readOnly
							/>
						</div>
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="profile-end">Shift end</Label>
							<Input
								id="profile-end"
								type="time"
								value={scheduleEnd}
								disabled
								readOnly
							/>
						</div>
					</div>

					<div className="grid gap-4 md:grid-cols-2">
						<div className="flex flex-col gap-1.5">
							<Label>Role</Label>
							<Input
								value={profile?.role ?? ''}
								disabled
								className="font-mono text-xs capitalize"
							/>
						</div>
						<div className="flex flex-col gap-1.5">
							<Label>Member since</Label>
							<Input
								value={
									profile?.createdAt
										? formatDate(profile.createdAt.slice(0, 10))
										: '-'
								}
								disabled
								className="font-mono text-xs"
							/>
						</div>
					</div>
				</div>

				<div className="flex items-center gap-2 border-t bg-muted/30 px-6 py-3">
					{saved ? (
						<span className="text-xs text-emerald-700 dark:text-emerald-400">
							Profile saved.
						</span>
					) : null}
					{error ? (
						<span className="text-xs text-destructive">{error}</span>
					) : null}
					<div className="flex-1" />
					<Button onClick={() => void handleSave()} disabled={busy}>
						{busy ? 'Saving…' : 'Save changes'}
					</Button>
				</div>
			</Card>
		</div>
	);
}
