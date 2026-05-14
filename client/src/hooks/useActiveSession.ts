import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { fetchActiveSession } from '../services/attendanceService';
import type { AttendanceRecord } from '../types/api';

export function useActiveSession() {
	const { user } = useAuth();
	const [session, setSession] = useState<AttendanceRecord | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const refresh = useCallback(async () => {
		if (!user) return;
		setLoading(true);
		setError(null);
		try {
			const result = await fetchActiveSession(user);
			setSession(result.session);
		} catch (caught) {
			setError(caught instanceof Error ? caught.message : 'Unknown error');
		} finally {
			setLoading(false);
		}
	}, [user]);

	useEffect(() => {
		if (!user) {
			setSession(null);
			setLoading(false);
			return;
		}
		const controller = new AbortController();
		setLoading(true);
		fetchActiveSession(user, controller.signal)
			.then((result) => setSession(result.session))
			.catch((caught) => {
				if ((caught as { name?: string })?.name === 'AbortError') return;
				setError(caught instanceof Error ? caught.message : 'Unknown error');
			})
			.finally(() => setLoading(false));
		return () => controller.abort();
	}, [user]);

	return { session, loading, error, refresh, setSession };
}
