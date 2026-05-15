import { signOut } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useProfile } from '@/hooks/useProfile';
import { auth } from '@/lib/firebase';

type Preferences = {
	theme: 'light' | 'dark' | 'system';
	punchReminders: boolean;
};

const DEFAULT_PREFS: Preferences = {
	theme: 'system',
	punchReminders: true,
};

const STORAGE_KEY = 'mini-hcm.prefs';

function loadPrefs(): Preferences {
	if (typeof window === 'undefined') return DEFAULT_PREFS;
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		if (!raw) return DEFAULT_PREFS;
		return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
	} catch {
		return DEFAULT_PREFS;
	}
}

function applyTheme(theme: Preferences['theme']) {
	if (typeof document === 'undefined') return;
	const root = document.documentElement;
	const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
	const dark = theme === 'dark' || (theme === 'system' && prefersDark);
	root.classList.toggle('dark', dark);
}

export function Settings() {
	const { profile } = useProfile();
	const [prefs, setPrefs] = useState<Preferences>(loadPrefs);

	useEffect(() => {
		try {
			window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
		} catch {
			/* ignore */
		}
		applyTheme(prefs.theme);
	}, [prefs]);

	function update<K extends keyof Preferences>(key: K, value: Preferences[K]) {
		setPrefs((p) => ({ ...p, [key]: value }));
	}

	async function handleSignOut() {
		try {
			await signOut(auth);
		} catch {
			/* surface on next interaction */
		}
	}

	const isAdmin = profile?.role === 'admin';

	return (
		<div className="flex flex-col gap-6 px-4 lg:px-6">
			<div>
				<h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
				<p className="text-sm text-muted-foreground">
					Personal preferences for this device. Stored locally.
				</p>
			</div>

			<Card className="gap-0 p-0">
				<div className="border-b px-6 py-4">
					<h2 className="text-sm font-semibold">Appearance</h2>
					<p className="text-xs text-muted-foreground">
						Choose how Mini HCM looks on this device.
					</p>
				</div>
				<div className="flex flex-col gap-3 px-6 py-5">
					<div className="flex flex-col gap-2">
						<Label>Theme</Label>
						<div className="flex flex-wrap gap-2">
							{(['system', 'light', 'dark'] as const).map((t) => (
								<Button
									key={t}
									type="button"
									variant={prefs.theme === t ? 'default' : 'outline'}
									size="sm"
									onClick={() => update('theme', t)}
									className="capitalize"
								>
									{t}
								</Button>
							))}
						</div>
					</div>
				</div>
			</Card>

			<Card className="gap-0 p-0">
				<div className="border-b px-6 py-4">
					<h2 className="text-sm font-semibold">Notifications</h2>
					<p className="text-xs text-muted-foreground">
						Pick which alerts reach you.
					</p>
				</div>
				<div className="flex flex-col gap-3 px-6 py-5">
					<PrefRow
						title="Punch-in reminders"
						hint="Notify me if I haven't punched in 5 minutes after my shift starts."
						checked={prefs.punchReminders}
						onChange={(v) => update('punchReminders', v)}
					/>
				</div>
			</Card>

			{isAdmin ? (
				<Card className="gap-0 p-0">
					<div className="border-b px-6 py-4">
						<h2 className="flex items-center gap-2 text-sm font-semibold">
							Workforce
							<Badge variant="outline" className="text-[10px]">
								admin
							</Badge>
						</h2>
						<p className="text-xs text-muted-foreground">
							Org-wide policies. Wired to mock data until the backend exposes
							these.
						</p>
					</div>
					<div className="flex flex-col gap-3 px-6 py-5">
						<PrefRow
							title="Require reason for punch edits"
							hint="Admins must enter a reason when editing a punch."
							checked
							disabled
							onChange={() => {}}
						/>
						<PrefRow
							title="Auto-approve overtime under 1h"
							hint="Bypasses manager review for small spillovers."
							checked={false}
							disabled
							onChange={() => {}}
						/>
						<PrefRow
							title="Auto-clock-out at 23:59"
							hint="Closes sessions left open past midnight."
							checked
							disabled
							onChange={() => {}}
						/>
					</div>
				</Card>
			) : null}

			<Card className="gap-0 p-0">
				<div className="border-b px-6 py-4">
					<h2 className="text-sm font-semibold">Account</h2>
					<p className="text-xs text-muted-foreground">
						Signed in as {profile?.email ?? '—'}
					</p>
				</div>
				<div className="flex items-center gap-3 px-6 py-5">
					<Button variant="outline" size="sm" disabled>
						Change password
					</Button>
					<div className="flex-1" />
					<Button
						variant="destructive"
						size="sm"
						onClick={() => void handleSignOut()}
					>
						Sign out
					</Button>
				</div>
			</Card>
		</div>
	);
}

function PrefRow({
	title,
	hint,
	checked,
	onChange,
	disabled,
}: {
	title: string;
	hint: string;
	checked: boolean;
	onChange: (v: boolean) => void;
	disabled?: boolean;
}) {
	return (
		<label className="flex cursor-pointer items-start gap-3 rounded-md border bg-card px-3 py-2.5 hover:bg-muted/30">
			<Checkbox
				checked={checked}
				onCheckedChange={(v) => onChange(Boolean(v))}
				disabled={disabled}
				className="mt-0.5"
			/>
			<div className="flex flex-col gap-0.5">
				<span className="text-sm font-medium">{title}</span>
				<span className="text-xs text-muted-foreground">{hint}</span>
			</div>
		</label>
	);
}
