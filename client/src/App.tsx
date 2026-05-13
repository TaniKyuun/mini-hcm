import {
	onAuthStateChanged,
	signInWithEmailAndPassword,
	signOut,
	type User,
} from 'firebase/auth';
import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { auth } from './lib/firebase';

type ApiResponse = {
	message: string;
	user: {
		uid: string;
		email: string | null;
	};
};

function App() {
	const [authReady, setAuthReady] = useState(false);
	const [user, setUser] = useState<User | null>(null);
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [authError, setAuthError] = useState('');
	const [serverMessage, setServerMessage] = useState('');
	const [apiError, setApiError] = useState('');

	useEffect(() => {
		return onAuthStateChanged(auth, (currentUser) => {
			setUser(currentUser);
			setAuthReady(true);
		});
	}, []);

	useEffect(() => {
		if (!user) {
			setServerMessage('');
			setApiError('');
			return;
		}

		const currentUser = user;
		let didCancel = false;

		async function loadProtectedMessage() {
			setApiError('');
			setServerMessage('');

			try {
				const token = await currentUser.getIdToken();
				const response = await fetch('/api', {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});

				if (!response.ok) {
					throw new Error('Unable to load protected API data.');
				}

				const data = (await response.json()) as ApiResponse;

				if (!didCancel) {
					setServerMessage(data.message);
				}
			} catch (_error) {
				if (!didCancel) {
					setApiError('We could not load the protected server message.');
				}
			}
		}

		void loadProtectedMessage();

		return () => {
			didCancel = true;
		};
	}, [user]);

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

	async function handleSignOut() {
		try {
			setAuthError('');
			await signOut(auth);
		} catch (_error) {
			setAuthError('Sign-out failed. Please try again.');
		}
	}

	if (!authReady) {
		return (
			<main className="grid min-h-screen place-items-center bg-zinc-50 px-6 text-zinc-900">
				<p className="text-sm font-medium text-zinc-600">
					Restoring secure session...
				</p>
			</main>
		);
	}

	if (!user) {
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
							<span className="text-sm font-medium text-zinc-700">
								Password
							</span>
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

	return (
		<main className="min-h-screen bg-zinc-50 text-zinc-900">
			<header className="border-b border-zinc-200 bg-white">
				<div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
					<div>
						<p className="text-sm font-medium text-teal-700">mini-hcm</p>
						<h1 className="text-xl font-semibold">Time tracking</h1>
					</div>

					<div className="flex items-center gap-3">
						<p className="hidden text-sm text-zinc-600 sm:block">
							{user.email}
						</p>
						<button
							className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium transition hover:border-zinc-400 hover:bg-zinc-100"
							type="button"
							onClick={handleSignOut}
						>
							Sign out
						</button>
					</div>
				</div>
			</header>

			<section className="mx-auto max-w-5xl px-6 py-8">
				<div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
					<p className="text-sm font-medium text-zinc-500">Protected API</p>
					<p className="mt-2 text-lg font-semibold">
						{serverMessage || 'Loading protected server message...'}
					</p>
					{apiError ? (
						<p className="mt-3 text-sm text-red-700">{apiError}</p>
					) : null}
				</div>
			</section>
		</main>
	);
}

export default App;
