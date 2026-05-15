import type { User } from 'firebase/auth';
import { apiRequestJson } from '../lib/apiClient';
import type {
	EditRequest,
	EditRequestsResponse,
	EditRequestStatus,
} from '../types/api';

export type CreateEditRequestBody = {
	attendanceId: string;
	/** ISO string with the new clock-in moment, or null/omitted to leave alone. */
	requestedTimeIn?: string | null;
	/** ISO string with the new clock-out moment, or null/omitted to leave alone. */
	requestedTimeOut?: string | null;
	reason: string;
};

export function createEditRequest(user: User, body: CreateEditRequestBody) {
	return apiRequestJson<EditRequest>(user, '/api/edit-requests', {
		method: 'POST',
		body,
	});
}

export function fetchMyEditRequests(user: User, signal?: AbortSignal) {
	return apiRequestJson<EditRequestsResponse>(user, '/api/edit-requests', {
		signal,
	});
}

export function fetchAdminEditRequests(
	user: User,
	status?: EditRequestStatus,
	signal?: AbortSignal,
) {
	const query = status ? `?status=${encodeURIComponent(status)}` : '';
	return apiRequestJson<EditRequestsResponse>(
		user,
		`/api/admin/edit-requests${query}`,
		{ signal },
	);
}

export function approveEditRequest(
	user: User,
	id: string,
	adminNote?: string,
) {
	return apiRequestJson<EditRequest>(
		user,
		`/api/admin/edit-requests/${id}/approve`,
		{
			method: 'POST',
			body: adminNote ? { adminNote } : {},
		},
	);
}

export function rejectEditRequest(user: User, id: string, adminNote?: string) {
	return apiRequestJson<EditRequest>(
		user,
		`/api/admin/edit-requests/${id}/reject`,
		{
			method: 'POST',
			body: adminNote ? { adminNote } : {},
		},
	);
}
