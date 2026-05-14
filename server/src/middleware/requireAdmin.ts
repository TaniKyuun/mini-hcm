import type { RequestHandler } from 'express';
import { getUserProfile } from '../services/userService';
import type { AuthenticatedLocals } from './authenticateFirebase';

export type AdminLocals = AuthenticatedLocals & {
	isAdmin: true;
};

export const requireAdmin: RequestHandler<
	Record<string, never>,
	unknown,
	unknown,
	Record<string, never>,
	AdminLocals
> = async (_req, res, next) => {
	try {
		const { uid } = res.locals.firebaseUser;
		const profile = await getUserProfile(uid);
		if (!profile || profile.role !== 'admin') {
			res.status(403).json({ error: 'Admin access required.' });
			return;
		}
		res.locals.isAdmin = true;
		next();
	} catch (error) {
		next(error);
	}
};
