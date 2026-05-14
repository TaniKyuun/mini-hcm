import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { fetchWeeklySummary } from '../services/attendanceService';
import type { DailySummary } from '../types/api';

export function useWeeklySummary(startDate?: string) {
	const { user } = useAuth();
	const [days, setDays] = useState<DailySummary[]>([]);
	const [resolvedStart, setResolvedStart] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const refresh = useCallback(async () => {
		if (!user) return;
		setLoading(true);
		setError(null);
		try {
			const result = await fetchWeeklySummary(user, startDate);
			setDays(result.days);
			setResolvedStart(result.startDate);
		} catch (caught) {
			setError(caught instanceof Error ? caught.message : 'Unknown error');
		} finally {
			setLoading(false);
		}
	}, [user, startDate]);

	useEffect(() => {
		if (!user) {
			setDays([]);
			setLoading(false);
			return;
		}
		const controller = new AbortController();
		setLoading(true);
		fetchWeeklySummary(user, startDate, controller.signal)
			.then((result) => {
				setDays(result.days);
				setResolvedStart(result.startDate);
			})
			.catch((caught) => {
				if ((caught as { name?: string })?.name === 'AbortError') return;
				setError(caught instanceof Error ? caught.message : 'Unknown error');
			})
			.finally(() => setLoading(false));
		return () => controller.abort();
	}, [user, startDate]);

	return { days, startDate: resolvedStart, loading, error, refresh };
}
