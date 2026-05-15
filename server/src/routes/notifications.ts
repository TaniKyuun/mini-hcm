import { type RequestHandler, Router } from 'express';
import { NOTIFICATIONS_COLLECTION } from '../lib/constants';
import { getFirestoreDb } from '../lib/firebase';
import { serializeNotification } from '../lib/serialize';
import {
	type AuthenticatedLocals,
	authenticateFirebase,
} from '../middleware/authenticateFirebase';
import type { NotificationDoc } from '../types/models';

const LIST_LIMIT = 20;

const listNotifications: RequestHandler<
	Record<string, never>,
	unknown,
	unknown,
	Record<string, never>,
	AuthenticatedLocals
> = async (_req, res, next) => {
	try {
		const uid = res.locals.firebaseUser.uid;
		const db = getFirestoreDb();
		const snapshot = await db
			.collection(NOTIFICATIONS_COLLECTION)
			.where('recipientUid', '==', uid)
			.orderBy('createdAt', 'desc')
			.limit(LIST_LIMIT)
			.get();

		const items = snapshot.docs.map((d) =>
			serializeNotification(d.id, d.data() as NotificationDoc),
		);
		const unreadCount = items.filter((n) => !n.read).length;
		res.json({ notifications: items, unreadCount });
	} catch (error) {
		next(error);
	}
};

const markRead: RequestHandler<
	{ id: string },
	unknown,
	unknown,
	Record<string, never>,
	AuthenticatedLocals
> = async (req, res, next) => {
	try {
		const uid = res.locals.firebaseUser.uid;
		const db = getFirestoreDb();
		const ref = db.collection(NOTIFICATIONS_COLLECTION).doc(req.params.id);
		const snapshot = await ref.get();
		if (!snapshot.exists) {
			res.status(404).json({ error: 'Notification not found.' });
			return;
		}
		const data = snapshot.data() as NotificationDoc;
		if (data.recipientUid !== uid) {
			res.status(403).json({ error: 'Forbidden.' });
			return;
		}
		if (!data.read) {
			await ref.update({ read: true });
		}
		res.status(204).end();
	} catch (error) {
		next(error);
	}
};

const markAllRead: RequestHandler<
	Record<string, never>,
	unknown,
	unknown,
	Record<string, never>,
	AuthenticatedLocals
> = async (_req, res, next) => {
	try {
		const uid = res.locals.firebaseUser.uid;
		const db = getFirestoreDb();
		const snapshot = await db
			.collection(NOTIFICATIONS_COLLECTION)
			.where('recipientUid', '==', uid)
			.where('read', '==', false)
			.get();

		if (snapshot.empty) {
			res.status(204).end();
			return;
		}

		const batch = db.batch();
		for (const d of snapshot.docs) {
			batch.update(d.ref, { read: true });
		}
		await batch.commit();
		res.status(204).end();
	} catch (error) {
		next(error);
	}
};

export const notificationsRouter = Router();

notificationsRouter.use(authenticateFirebase);
notificationsRouter.get('/', listNotifications);
notificationsRouter.patch('/read-all', markAllRead);
notificationsRouter.patch('/:id/read', markRead);
