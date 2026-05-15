import type { User } from 'firebase/auth';
import { apiRequestJson } from '../lib/apiClient';
import type {
	AdminAttendanceByDateResponse,
	AdminAttendanceResponse,
	AttendanceRecord,
	DailyReportResponse,
	EmployeesResponse,
	EmploymentType,
	UserLocation,
	UserProfile,
	UserRole,
	UserSchedule,
	WeeklyReportResponse,
} from '../types/api';

export function fetchEmployees(user: User, signal?: AbortSignal) {
	return apiRequestJson<EmployeesResponse>(user, '/api/admin/employees', {
		signal,
	});
}

export type AdminUpdateProfileBody = {
	name?: string;
	email?: string;
	role?: UserRole;
	timezone?: string;
	schedule?: UserSchedule;
	location?: UserLocation;
	employmentType?: EmploymentType;
};

export function adminUpdateEmployee(
	user: User,
	uid: string,
	body: AdminUpdateProfileBody,
) {
	return apiRequestJson<UserProfile>(user, `/api/admin/employees/${uid}`, {
		method: 'PUT',
		body,
	});
}

export type CreateEmployeeBody = {
	name: string;
	email: string;
	password: string;
	role?: UserRole;
	timezone?: string;
	schedule?: UserSchedule;
	location?: UserLocation;
	employmentType?: EmploymentType;
};

export function createEmployee(user: User, body: CreateEmployeeBody) {
	return apiRequestJson<UserProfile>(user, '/api/admin/employees', {
		method: 'POST',
		body,
	});
}

export function triggerTestNotification(user: User, recipientUid?: string) {
	return apiRequestJson<{ id: string; recipientUid: string }>(
		user,
		'/api/admin/notifications/test',
		{
			method: 'POST',
			body: recipientUid ? { recipientUid } : {},
		},
	);
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
	return apiRequestJson<AdminAttendanceResponse>(
		user,
		`/api/admin/attendance?${params.toString()}`,
		{ signal },
	);
}

/**
 * Single bulk query: every employee's sessions on `date` in one request.
 * Replaces the previous "N-employees-times-one-fetch-each" pattern.
 */
export function fetchAdminAttendanceByDate(
	user: User,
	date: string,
	signal?: AbortSignal,
) {
	return apiRequestJson<AdminAttendanceByDateResponse>(
		user,
		`/api/admin/attendance/by-date?date=${encodeURIComponent(date)}`,
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
	return apiRequestJson<AttendanceRecord>(user, `/api/admin/attendance/${id}`, {
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
	return apiRequestJson<DailyReportResponse>(
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
	return apiRequestJson<WeeklyReportResponse>(
		user,
		`/api/admin/reports/weekly${query}`,
		{ signal },
	);
}
