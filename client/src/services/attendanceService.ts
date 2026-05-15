import type { User } from 'firebase/auth';
import { apiRequestJson } from '../lib/apiClient';
import type {
	ActiveSessionResponse,
	AttendanceRecord,
	DailySummaryResponse,
	HistoryResponse,
	UserProfile,
	UserSchedule,
	WeeklySummaryResponse,
} from '../types/api';

export function fetchMe(user: User, signal?: AbortSignal) {
	return apiRequestJson<UserProfile>(user, '/api/me', { signal });
}

export type UpdateProfileBody = {
	name?: string;
	timezone?: string;
	schedule?: UserSchedule;
};

export function updateMe(user: User, body: UpdateProfileBody) {
	return apiRequestJson<UserProfile>(user, '/api/me', { method: 'PUT', body });
}

export function fetchActiveSession(user: User, signal?: AbortSignal) {
	return apiRequestJson<ActiveSessionResponse>(user, '/api/attendance/active', {
		signal,
	});
}

export function postPunchIn(user: User) {
	return apiRequestJson<AttendanceRecord>(user, '/api/attendance/punch-in', {
		method: 'POST',
	});
}

export function postPunchOut(user: User) {
	return apiRequestJson<AttendanceRecord>(user, '/api/attendance/punch-out', {
		method: 'POST',
	});
}

export function fetchHistory(
	user: User,
	startDate?: string,
	endDate?: string,
	signal?: AbortSignal,
) {
	const params = new URLSearchParams();
	if (startDate) params.set('startDate', startDate);
	if (endDate) params.set('endDate', endDate);
	const query = params.toString();
	return apiRequestJson<HistoryResponse>(
		user,
		`/api/attendance/history${query ? `?${query}` : ''}`,
		{ signal },
	);
}

export function fetchDailySummary(
	user: User,
	date?: string,
	signal?: AbortSignal,
) {
	const query = date ? `?date=${encodeURIComponent(date)}` : '';
	return apiRequestJson<DailySummaryResponse>(
		user,
		`/api/summary/daily${query}`,
		{
			signal,
		},
	);
}

export function fetchWeeklySummary(
	user: User,
	startDate?: string,
	signal?: AbortSignal,
) {
	const query = startDate ? `?startDate=${encodeURIComponent(startDate)}` : '';
	return apiRequestJson<WeeklySummaryResponse>(
		user,
		`/api/summary/weekly${query}`,
		{ signal },
	);
}
