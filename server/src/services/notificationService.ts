import {
	type DocumentReference,
	FieldValue,
	type Timestamp,
	type WriteBatch,
} from 'firebase-admin/firestore';
import { NOTIFICATIONS_COLLECTION } from '../lib/constants';
import { getFirestoreDb } from '../lib/firebase';
import type {
	NotificationDoc,
	NotificationMetadata,
	NotificationType,
} from '../types/models';

/**
 * Optional batch context for callers that want to commit the notification write
 * atomically with another mutation (e.g. an edit-request status flip). When
 * passed, the caller is responsible for `batch.commit()`.
 */
export type NotificationWriteContext = {
	batch: WriteBatch;
	ref: DocumentReference;
};

export async function createNotification(
	input: {
		recipientUid: string;
		actorUid: string;
		type: NotificationType;
		title: string;
		body: string;
		metadata?: NotificationMetadata;
	},
	ctx?: NotificationWriteContext,
): Promise<string> {
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
	if (ctx) {
		ctx.batch.set(ctx.ref, doc);
		return ctx.ref.id;
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
