import type { RequestHandler } from 'express';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { getFirebaseAuth } from '../lib/firebase';

export type AuthenticatedLocals = {
	firebaseUser: DecodedIdToken;
};

export const authenticateFirebase: RequestHandler<
	Record<string, never>,
	unknown,
	unknown,
	Record<string, never>,
	AuthenticatedLocals
> = async (req, res, next) => {
	const authHeader = req.header('authorization');
	const token = authHeader?.startsWith('Bearer ')
		? authHeader.slice('Bearer '.length).trim()
		: '';

	if (!token) {
		res.status(401).json({ error: 'Missing Firebase ID token.' });
		return;
	}

	try {
		res.locals.firebaseUser = await getFirebaseAuth().verifyIdToken(token);
		next();
	} catch (error) {
		console.error('Firebase token verification failed', error);
		res.status(401).json({ error: 'Invalid Firebase ID token.' });
	}
};
