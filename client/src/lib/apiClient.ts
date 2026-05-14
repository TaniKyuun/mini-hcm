import type { User } from 'firebase/auth';

export class ApiError extends Error {
	status: number;

	constructor(status: number, message: string) {
		super(message);
		this.status = status;
		this.name = 'ApiError';
	}
}

export type RequestOptions = {
	method?: string;
	body?: unknown;
	signal?: AbortSignal;
};

export async function apiRequest<T>(
	user: User,
	path: string,
	options: RequestOptions = {},
): Promise<T> {
	const token = await user.getIdToken();
	const headers: Record<string, string> = {
		Authorization: `Bearer ${token}`,
	};

	let body: BodyInit | undefined;
	if (options.body !== undefined) {
		headers['Content-Type'] = 'application/json';
		body = JSON.stringify(options.body);
	}

	const response = await fetch(path, {
		method: options.method ?? 'GET',
		headers,
		body,
		signal: options.signal,
	});

	if (!response.ok) {
		let message = `Request failed (${response.status})`;
		try {
			const errorBody = (await response.json()) as { error?: string };
			if (errorBody?.error) message = errorBody.error;
		} catch (_error) {
			// ignore
		}
		throw new ApiError(response.status, message);
	}

	if (response.status === 204) {
		return undefined as T;
	}

	return (await response.json()) as T;
}
