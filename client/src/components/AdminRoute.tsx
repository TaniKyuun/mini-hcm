import { Navigate, Outlet } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/lib/auth';

export function AdminRoute() {
	const { user } = useAuth();
	const { profile, error } = useProfile();

	if (user && !profile && !error) {
		return (
			<main className="grid min-h-screen place-items-center bg-zinc-50 px-6 text-zinc-900">
				<p className="text-sm font-medium text-zinc-600">Checking access...</p>
			</main>
		);
	}

	if (profile?.role !== 'admin') {
		return <Navigate to="/" replace />;
	}

	return <Outlet />;
}
