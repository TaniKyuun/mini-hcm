import { onAuthStateChanged, type User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthContext } from './lib/auth';
import { auth } from './lib/firebase';
import { Admin } from './pages/Admin';
import { AppLayout } from './pages/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { History } from './pages/History';
import { SignIn } from './pages/SignIn';

function App() {
	const [authReady, setAuthReady] = useState(false);
	const [user, setUser] = useState<User | null>(null);

	useEffect(() => {
		return onAuthStateChanged(auth, (currentUser) => {
			setUser(currentUser);
			setAuthReady(true);
		});
	}, []);

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
		return <SignIn />;
	}

	return (
		<AuthContext.Provider value={{ user, authReady }}>
			<BrowserRouter>
				<Routes>
					<Route element={<AppLayout />}>
						<Route index element={<Dashboard />} />
						<Route path="history" element={<History />} />
						<Route path="admin" element={<Admin />} />
					</Route>
					<Route path="*" element={<Navigate to="/" replace />} />
				</Routes>
			</BrowserRouter>
		</AuthContext.Provider>
	);
}

export default App;
