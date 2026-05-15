import type { User } from 'firebase/auth';
import { apiRequest, apiRequestJson } from '../lib/apiClient';
import type { NotificationsResponse } from '../types/api';

export function fetchNotifications(user: User, signal?: AbortSignal) {
	return apiRequestJson<NotificationsResponse>(user, '/api/notifications', {
		signal,
	});
}

export function markNotificationRead(user: User, id: string) {
	return apiRequest<void>(user, `/api/notifications/${id}/read`, {
		method: 'PATCH',
	});
}

export function markAllNotificationsRead(user: User) {
	return apiRequest<void>(user, '/api/notifications/read-all', {
		method: 'PATCH',
	});
}
