import { signInWithEmailAndPassword } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { auth } from '@/lib/firebase';

function LiveClock() {
	const [now, setNow] = useState(new Date());

	useEffect(() => {
		const id = setInterval(() => setNow(new Date()), 1000);
		return () => clearInterval(id);
	}, []);

	const timeStr = now.toLocaleTimeString('en-US', {
		hour: '2-digit',
		minute: '2-digit',
		hour12: true,
	});
	const dateStr = now.toLocaleDateString('en-US', {
		weekday: 'short',
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	});
	const offsetMins = -now.getTimezoneOffset();
	const offsetHrs = Math.floor(Math.abs(offsetMins) / 60);
	const offsetStr = `UTC${offsetMins >= 0 ? '+' : '-'}${String(offsetHrs).padStart(2, '0')}`;

	return (
		<div className="flex items-center justify-between rounded-lg border border-white/15 bg-white/5 px-4 py-3 font-mono">
			<div className="flex items-center gap-3">
				<svg
					aria-hidden="true"
					className="size-4 shrink-0 text-white/40"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					viewBox="0 0 24 24"
				>
					<circle cx="12" cy="12" r="10" />
					<polyline points="12 6 12 12 16 14" />
				</svg>
				<div className="flex flex-col">
					<span className="text-xl font-semibold leading-none text-white">
						{timeStr}
					</span>
					<span className="mt-1 text-xs text-white/40">
						{dateStr} · {offsetStr}
					</span>
				</div>
			</div>
			<span className="flex items-center gap-1.5 text-xs text-green-400">
				<span className="size-1.5 rounded-full bg-green-400" />
				live
			</span>
		</div>
	);
}

export function SignIn() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [authError, setAuthError] = useState('');

	async function handleSignIn() {
		setAuthError('');
		setIsSubmitting(true);

		try {
			await signInWithEmailAndPassword(auth, email, password);
			setPassword('');
		} catch (_error) {
			setAuthError('Sign-in failed. Check your email and password.');
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<div className="flex min-h-screen">
			{/* Left dark panel */}
			<div className="relative flex w-[55%] flex-col bg-[#111111] px-10 py-8 text-white max-lg:hidden">
				{/* Logo */}
				<div className="flex items-center gap-2.5">
					<div className="flex size-8 items-center justify-center rounded-full border border-white/25">
						<div className="size-2 rounded-full bg-white" />
					</div>
					<span className="text-sm font-medium tracking-tight">Mini HCM</span>
				</div>

				{/* Hero text + clock */}
				<div className="mt-auto">
					<h1 className="text-5xl font-bold leading-[1.1] tracking-tight">
						Time, tracked.
						<br />
						<span className="text-white/40">People, in step.</span>
					</h1>
					<p className="mt-5 max-w-xs text-sm leading-relaxed text-white/45">
						Punch in &amp; out, see your week at a glance, and let admins handle
						the rest.
					</p>
					<div className="mt-6 max-w-xs">
						<LiveClock />
					</div>
				</div>
			</div>

			{/* Right white panel */}
			<div className="relative flex flex-1 flex-col bg-white px-12 py-8 text-foreground lg:px-16">
				{/* Centered form */}
				<div className="flex flex-1 items-center justify-center">
					<div className="w-full max-w-sm">
						<p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
							Sign in
						</p>
						<p className="mt-2 text-sm text-muted-foreground">
							Use your work email to continue.
						</p>

						<form
							className="mt-4 flex flex-col gap-5"
							onSubmit={(e) => {
								e.preventDefault();
								void handleSignIn();
							}}
						>
							<div className="flex flex-col gap-1.5">
								<Label
									htmlFor="signin-email"
									className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground"
								>
									Email
								</Label>
								<Input
									id="signin-email"
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									autoComplete="email"
									required
									className="h-11"
								/>
							</div>

							<div className="flex flex-col gap-1.5">
								<Label
									htmlFor="signin-password"
									className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground"
								>
									Password
								</Label>
								<Input
									id="signin-password"
									type="password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									autoComplete="current-password"
									required
									className="h-11"
								/>
							</div>

							{authError ? (
								<p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
									{authError}
								</p>
							) : null}

							<Button
								type="submit"
								disabled={isSubmitting}
								className="h-11 w-full text-base"
							>
								{isSubmitting ? 'Signing in…' : 'Sign in →'}
							</Button>
						</form>
					</div>
				</div>
			</div>
		</div>
	);
}
