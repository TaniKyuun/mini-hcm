import { type RequestHandler, Router } from 'express';
import { serializeEditRequest } from '../lib/serialize.js';
import {
	type AuthenticatedLocals,
	authenticateFirebase,
} from '../middleware/authenticateFirebase.js';
import { NotFoundError } from '../services/attendanceService.js';
import {
	createEditRequest,
	listEditRequestsForUser,
} from '../services/editRequestService.js';
import { ValidationError } from '../services/userService.js';

type CreateEditRequestBody = {
	attendanceId?: string;
	requestedTimeIn?: string | null;
	requestedTimeOut?: string | null;
	reason?: string;
};

const postEditRequest: RequestHandler<
	Record<string, never>,
	unknown,
	CreateEditRequestBody,
	Record<string, never>,
	AuthenticatedLocals
> = async (req, res, next) => {
	try {
		const body = req.body ?? {};
		if (typeof body.attendanceId !== 'string' || !body.attendanceId.trim()) {
			res
				.status(400)
				.json({ error: 'attendanceId is required.', field: 'attendanceId' });
			return;
		}
		const requesterUid = res.locals.firebaseUser.uid;
		const created = await createEditRequest({
			attendanceId: body.attendanceId.trim(),
			requesterUid,
			requestedTimeIn: body.requestedTimeIn,
			requestedTimeOut: body.requestedTimeOut,
			reason: body.reason ?? '',
		});
		res.status(201).json(serializeEditRequest(created.id, created));
	} catch (error) {
		if (error instanceof NotFoundError) {
			res.status(404).json({ error: error.message });
			return;
		}
		if (error instanceof ValidationError) {
			res.status(400).json({ error: error.message, field: error.field });
			return;
		}
		next(error);
	}
};

const getMyEditRequests: RequestHandler<
	Record<string, never>,
	unknown,
	unknown,
	Record<string, never>,
	AuthenticatedLocals
> = async (_req, res, next) => {
	try {
		const uid = res.locals.firebaseUser.uid;
		const items = await listEditRequestsForUser(uid);
		// Newest first; client also sorts, but keeping the wire ordered helps.
		const sorted = items.sort(
			(a, b) => b.createdAt.toMillis() - a.createdAt.toMillis(),
		);
		res.json({
			editRequests: sorted.map((r) => serializeEditRequest(r.id, r)),
		});
	} catch (error) {
		next(error);
	}
};

export const editRequestsRouter = Router();

editRequestsRouter.use(authenticateFirebase);
editRequestsRouter.post('/', postEditRequest);
editRequestsRouter.get('/', getMyEditRequests);
