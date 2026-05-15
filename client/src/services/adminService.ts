import type { User } from 'firebase/auth';
import { apiRequest } from '../lib/apiClient';
import type {
	AdminAttendanceResponse,
	AttendanceRecord,
	DailyReportResponse,
	EmployeesResponse,
	UserProfile,
	UserRole,
	UserSchedule,
	WeeklyReportResponse,
} from '../types/api';

export function fetchEmployees(user: User, signal?: AbortSignal) {
	return apiRequest<EmployeesResponse>(user, '/api/admin/employees', {
		signal,
	});
}

export type AdminUpdateProfileBody = {
	name?: string;
	email?: string;
	role?: UserRole;
	timezone?: string;
	schedule?: UserSchedule;
};

export function adminUpdateEmployee(
	user: User,
	uid: string,
	body: AdminUpdateProfileBody,
) {
	return apiRequest<UserProfile>(user, `/api/admin/employees/${uid}`, {
		method: 'PUT',
		body,
	});
}

export function fetchAdminAttendance(
	user: User,
	userId: string,
	startDate?: string,
	endDate?: string,
	signal?: AbortSignal,
) {
	const params = new URLSearchParams({ userId });
	if (startDate) params.set('startDate', startDate);
	if (endDate) params.set('endDate', endDate);
	return apiRequest<AdminAttendanceResponse>(
		user,
		`/api/admin/attendance?${params.toString()}`,
		{ signal },
	);
}

export type AdminAttendanceUpdateBody = {
	timeIn?: string;
	timeOut?: string | null;
	reason?: string;
	notify?: boolean;
};

export function adminUpdateAttendance(
	user: User,
	id: string,
	body: AdminAttendanceUpdateBody,
) {
	return apiRequest<AttendanceRecord>(user, `/api/admin/attendance/${id}`, {
		method: 'PUT',
		body,
	});
}

export function fetchDailyReport(
	user: User,
	date?: string,
	signal?: AbortSignal,
) {
	const query = date ? `?date=${encodeURIComponent(date)}` : '';
	return apiRequest<DailyReportResponse>(
		user,
		`/api/admin/reports/daily${query}`,
		{ signal },
	);
}

export function fetchWeeklyReport(
	user: User,
	startDate?: string,
	signal?: AbortSignal,
) {
	const query = startDate ? `?startDate=${encodeURIComponent(startDate)}` : '';
	return apiRequest<WeeklyReportResponse>(
		user,
		`/api/admin/reports/weekly${query}`,
		{ signal },
	);
}
