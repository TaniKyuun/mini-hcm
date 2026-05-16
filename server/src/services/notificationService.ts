import { FieldValue, type Timestamp } from 'firebase-admin/firestore';
import { NOTIFICATIONS_COLLECTION } from '../lib/constants.js';
import { getFirestoreDb } from '../lib/firebase.js';
import type {
	NotificationDoc,
	NotificationMetadata,
	NotificationType,
} from '../types/models.js';

export async function createNotification(input: {
	recipientUid: string;
	actorUid: string;
	type: NotificationType;
	title: string;
	body: string;
	metadata?: NotificationMetadata;
}): Promise<string> {
	const db = getFirestoreDb();
	const doc: NotificationDoc = {
		recipientUid: input.recipientUid,
		actorUid: input.actorUid,
		type: input.type,
		read: false,
		title: input.title,
		body: input.body,
		createdAt: FieldValue.serverTimestamp() as unknown as Timestamp,
	};
	if (input.metadata) {
		doc.metadata = input.metadata;
	}
	const ref = await db.collection(NOTIFICATIONS_COLLECTION).add(doc);
	return ref.id;
}

export async function notifyEmployeeOfEdit(
	recipientUid: string,
	actorUid: string,
	reason: string | null,
	metadata: { attendanceId: string; date: string },
): Promise<void> {
	const body = reason
		? `Reason: ${reason}`
		: 'An admin updated your time entry.';
	await createNotification({
		recipientUid,
		actorUid,
		type: 'punch_edited',
		title: 'Your time entry was edited',
		body,
		metadata,
	});
	console.info(
		`[notify] punch_edited recipient=${recipientUid} actor=${actorUid} attendance=${metadata.attendanceId}`,
	);
}
