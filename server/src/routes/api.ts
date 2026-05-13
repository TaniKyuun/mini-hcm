import { type RequestHandler, Router } from 'express';
import {
	type AuthenticatedLocals,
	authenticateFirebase,
} from '../middleware/authenticateFirebase';

type ProtectedApiResponse = {
	message: string;
	user: {
		uid: string;
		email: string | null;
	};
};

const getProtectedApi: RequestHandler<
	Record<string, never>,
	ProtectedApiResponse,
	unknown,
	Record<string, never>,
	AuthenticatedLocals
> = (_req, res) => {
	const user = res.locals.firebaseUser;

	res.json({
		message: 'Hello from the protected server side!',
		user: {
			uid: user.uid,
			email: user.email ?? null,
		},
	});
};

export const apiRouter = Router();

apiRouter.get('/', authenticateFirebase, getProtectedApi);
