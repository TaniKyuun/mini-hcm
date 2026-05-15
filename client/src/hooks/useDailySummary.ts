import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { fetchDailySummary } from '../services/attendanceService';
import type { DailySummary } from '../types/api';

export function useDailySummary(date?: string) {
	const { user } = useAuth();
	const [summary, setSummary] = useState<DailySummary | null>(null);
	const [resolvedDate, setResolvedDate] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const refresh = useCallback(async () => {
		if (!user) return;
		setLoading(true);
		setError(null);
		try {
			const result = await fetchDailySummary(user, date);
			setSummary(result.summary);
			setResolvedDate(result.date);
		} catch (caught) {
			setError(caught instanceof Error ? caught.message : 'Unknown error');
		} finally {
			setLoading(false);
		}
	}, [user, date]);

	useEffect(() => {
		if (!user) {
			setSummary(null);
			setLoading(false);
			return;
		}
		const controller = new AbortController();
		setLoading(true);
		fetchDailySummary(user, date, controller.signal)
			.then((result) => {
				setSummary(result.summary);
				setResolvedDate(result.date);
			})
			.catch((caught) => {
				if ((caught as { name?: string })?.name === 'AbortError') return;
				setError(caught instanceof Error ? caught.message : 'Unknown error');
			})
			.finally(() => setLoading(false));
		return () => controller.abort();
	}, [user, date]);

	return { summary, date: resolvedDate, loading, error, refresh };
}
