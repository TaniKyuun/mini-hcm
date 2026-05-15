import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { fetchMe } from '../services/attendanceService';
import type { UserProfile } from '../types/api';

export function useProfile() {
	const { user } = useAuth();
	const [profile, setProfile] = useState<UserProfile | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const refresh = useCallback(async () => {
		if (!user) return;
		setLoading(true);
		setError(null);
		try {
			const result = await fetchMe(user);
			setProfile(result);
		} catch (caught) {
			setError(caught instanceof Error ? caught.message : 'Unknown error');
		} finally {
			setLoading(false);
		}
	}, [user]);

	useEffect(() => {
		if (!user) {
			setProfile(null);
			return;
		}
		const controller = new AbortController();
		setLoading(true);
		fetchMe(user, controller.signal)
			.then((result) => setProfile(result))
			.catch((caught) => {
				if ((caught as { name?: string })?.name === 'AbortError') return;
				setError(caught instanceof Error ? caught.message : 'Unknown error');
			})
			.finally(() => setLoading(false));
		return () => controller.abort();
	}, [user]);

	return { profile, loading, error, refresh };
}
