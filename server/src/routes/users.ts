import { type RequestHandler, Router } from 'express';
import { serializeProfile } from '../lib/serialize';
import {
	type AuthenticatedLocals,
	authenticateFirebase,
} from '../middleware/authenticateFirebase';
import {
	getOrCreateUserProfile,
	updateOwnProfile,
	ValidationError,
} from '../services/userService';

const getMe: RequestHandler<
	Record<string, never>,
	unknown,
	unknown,
	Record<string, never>,
	AuthenticatedLocals
> = async (_req, res, next) => {
	try {
		const { uid, email, name } = res.locals.firebaseUser;
		const profile = await getOrCreateUserProfile({
			uid,
			email: email ?? null,
			displayName: name ?? null,
		});
		res.json(serializeProfile(profile));
	} catch (error) {
		next(error);
	}
};

type UpdateProfileBody = {
	name?: string;
	timezone?: string;
	schedule?: { start: string; end: string };
};

const putMe: RequestHandler<
	Record<string, never>,
	unknown,
	UpdateProfileBody,
	Record<string, never>,
	AuthenticatedLocals
> = async (req, res, next) => {
	try {
		const { uid } = res.locals.firebaseUser;
		const updated = await updateOwnProfile(uid, req.body ?? {});
		res.json(serializeProfile(updated));
	} catch (error) {
		if (error instanceof ValidationError) {
			res.status(400).json({ error: error.message, field: error.field });
			return;
		}
		next(error);
	}
};

export const usersRouter = Router();

usersRouter.get('/me', authenticateFirebase, getMe);
usersRouter.put('/me', authenticateFirebase, putMe);
