import { signInWithEmailAndPassword } from 'firebase/auth';
import { type FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { auth } from '@/lib/firebase';

export function SignIn() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [authError, setAuthError] = useState('');

	async function handleSignIn(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
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
		<main className="grid min-h-screen place-items-center bg-muted/30 px-6 py-10 text-foreground">
			<Card className="w-full max-w-sm">
				<div className="px-6">
					<p className="text-sm font-medium text-primary">mini-hcm</p>
					<h1 className="mt-1 text-2xl font-semibold tracking-tight">
						Employee sign-in
					</h1>
				</div>

				<form className="flex flex-col gap-4 px-6 pb-2" onSubmit={handleSignIn}>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="signin-email">Email</Label>
						<Input
							id="signin-email"
							type="email"
							value={email}
							onChange={(event) => setEmail(event.target.value)}
							autoComplete="email"
							required
						/>
					</div>

					<div className="flex flex-col gap-1.5">
						<Label htmlFor="signin-password">Password</Label>
						<Input
							id="signin-password"
							type="password"
							value={password}
							onChange={(event) => setPassword(event.target.value)}
							autoComplete="current-password"
							required
						/>
					</div>

					{authError ? (
						<p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
							{authError}
						</p>
					) : null}

					<Button type="submit" disabled={isSubmitting} className="w-full">
						{isSubmitting ? 'Signing in…' : 'Sign in'}
					</Button>
				</form>
			</Card>
		</main>
	);
}
