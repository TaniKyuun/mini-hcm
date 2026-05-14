import { signInWithEmailAndPassword } from 'firebase/auth';
import { type FormEvent, useState } from 'react';
import { auth } from '../lib/firebase';

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
		<main className="grid min-h-screen place-items-center bg-zinc-50 px-6 py-10 text-zinc-900">
			<section className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
				<div className="mb-6">
					<p className="text-sm font-medium text-teal-700">mini-hcm</p>
					<h1 className="mt-2 text-2xl font-semibold">Employee sign-in</h1>
				</div>

				<form className="space-y-4" onSubmit={handleSignIn}>
					<label className="block">
						<span className="text-sm font-medium text-zinc-700">Email</span>
						<input
							className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
							type="email"
							value={email}
							onChange={(event) => setEmail(event.target.value)}
							autoComplete="email"
							required
						/>
					</label>

					<label className="block">
						<span className="text-sm font-medium text-zinc-700">Password</span>
						<input
							className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
							type="password"
							value={password}
							onChange={(event) => setPassword(event.target.value)}
							autoComplete="current-password"
							required
						/>
					</label>

					{authError ? (
						<p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
							{authError}
						</p>
					) : null}

					<button
						className="w-full rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
						type="submit"
						disabled={isSubmitting}
					>
						{isSubmitting ? 'Signing in...' : 'Sign in'}
					</button>
				</form>
			</section>
		</main>
	);
}
