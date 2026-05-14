import { signOut } from 'firebase/auth';
import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useProfile } from '../hooks/useProfile';
import { useAuth } from '../lib/auth';
import { auth } from '../lib/firebase';

const baseLinkClass =
	'rounded-md px-3 py-2 text-sm font-medium transition hover:bg-zinc-100';
const activeLinkClass = 'bg-zinc-900 text-white hover:bg-zinc-900';

function navLinkClass({ isActive }: { isActive: boolean }) {
	return `${baseLinkClass} ${isActive ? activeLinkClass : 'text-zinc-700'}`;
}

export function AppLayout() {
	const { user } = useAuth();
	const { profile } = useProfile();
	const [signOutError, setSignOutError] = useState('');

	async function handleSignOut() {
		try {
			setSignOutError('');
			await signOut(auth);
		} catch (_error) {
			setSignOutError('Sign-out failed. Please try again.');
		}
	}

	return (
		<div className="min-h-screen bg-zinc-50 text-zinc-900">
			<header className="border-b border-zinc-200 bg-white">
				<div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-4">
					<div>
						<p className="text-sm font-medium text-teal-700">mini-hcm</p>
						<h1 className="text-lg font-semibold">Time tracking</h1>
					</div>

					<nav className="flex items-center gap-1">
						<NavLink to="/" end className={navLinkClass}>
							Dashboard
						</NavLink>
						<NavLink to="/history" className={navLinkClass}>
							History
						</NavLink>
						{profile?.role === 'admin' ? (
							<NavLink to="/admin" className={navLinkClass}>
								Admin
							</NavLink>
						) : null}
					</nav>

					<div className="flex items-center gap-3">
						<p className="hidden text-sm text-zinc-600 sm:block">
							{profile?.name ?? user?.email}
						</p>
						<button
							type="button"
							className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium transition hover:border-zinc-400 hover:bg-zinc-100"
							onClick={handleSignOut}
						>
							Sign out
						</button>
					</div>
				</div>
			</header>

			<main className="mx-auto max-w-5xl px-6 py-8">
				{signOutError ? (
					<p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
						{signOutError}
					</p>
				) : null}
				<Outlet />
			</main>
		</div>
	);
}
