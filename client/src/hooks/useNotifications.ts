import {
	collection,
	onSnapshot,
	query,
	type Timestamp,
	where,
} from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { db } from '../lib/firebase';
import {
	markAllNotificationsRead,
	markNotificationRead,
} from '../services/notificationService';
import type { Notification, NotificationMetadata } from '../types/api';

const LIST_LIMIT = 20;

type FirestoreNotification = {
	recipientUid: string;
	actorUid: string;
	type: Notification['type'];
	read: boolean;
	title: string;
	body: string;
	metadata?: NotificationMetadata;
	createdAt: Timestamp | null;
};

export function useNotifications() {
	const { user } = useAuth();
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!user) {
			setNotifications([]);
			return;
		}
		// NOTE: intentionally no orderBy/limit on the server-side query so we
		// don't need a composite index. Sorting + slicing happens client-side.
		const q = query(
			collection(db, 'notifications'),
			where('recipientUid', '==', user.uid),
		);
		const unsub = onSnapshot(
			q,
			(snap) => {
				const items: Notification[] = snap.docs
					.map((d) => {
						const data = d.data() as FirestoreNotification;
						return {
							id: d.id,
							recipientUid: data.recipientUid,
							actorUid: data.actorUid,
							type: data.type,
							read: data.read,
							title: data.title,
							body: data.body,
							metadata: data.metadata,
							createdAt: data.createdAt?.toDate().toISOString() ?? null,
						};
					})
					.sort((a, b) => {
						const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
						const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
						return tb - ta;
					})
					.slice(0, LIST_LIMIT);
				setNotifications(items);
				setError(null);
			},
			(err) => {
				console.error('[useNotifications] onSnapshot error:', err);
				setError(err.message);
			},
		);
		return () => unsub();
	}, [user]);

	const markRead = useCallback(
		async (id: string) => {
			if (!user) return;
			setNotifications((prev) =>
				prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
			);
			try {
				await markNotificationRead(user, id);
			} catch (caught) {
				setError(caught instanceof Error ? caught.message : 'Unknown error');
			}
		},
		[user],
	);

	const markAllRead = useCallback(async () => {
		if (!user) return;
		setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
		try {
			await markAllNotificationsRead(user);
		} catch (caught) {
			setError(caught instanceof Error ? caught.message : 'Unknown error');
		}
	}, [user]);

	const unreadCount = notifications.reduce(
		(acc, n) => acc + (n.read ? 0 : 1),
		0,
	);

	return { notifications, unreadCount, error, markRead, markAllRead };
}
