import { DAILY_SUMMARY_COLLECTION } from '../lib/constants';
import { getFirestoreDb } from '../lib/firebase';
import { writeDailySummary } from '../services/summaryService';
import type { DailySummaryDoc } from '../types/models';

/**
 * One-off backfill: re-run writeDailySummary for every existing dailySummary
 * doc so legacy docs gain the firstTimeIn / lastTimeOut fields. Safe to re-run;
 * writeDailySummary recomputes totals from the underlying attendance sessions.
 */
async function main(): Promise<void> {
	const db = getFirestoreDb();
	const snapshot = await db.collection(DAILY_SUMMARY_COLLECTION).get();
	console.log(`Found ${snapshot.size} dailySummary docs.`);

	let rewritten = 0;
	let skipped = 0;
	for (const doc of snapshot.docs) {
		const data = doc.data() as DailySummaryDoc;
		if (!data.userId || !data.date) {
			console.warn(`  · skip ${doc.id} (missing userId or date)`);
			skipped += 1;
			continue;
		}
		try {
			await writeDailySummary(db, data.userId, data.date);
			rewritten += 1;
			if (rewritten % 25 === 0) {
				console.log(`  · rewrote ${rewritten}/${snapshot.size}…`);
			}
		} catch (err) {
			console.error(`  · failed ${doc.id}:`, err);
			skipped += 1;
		}
	}

	console.log(`\nDone. Rewrote ${rewritten}, skipped ${skipped}.`);
}

main().catch((err) => {
	console.error('Backfill failed:', err);
	process.exit(1);
});
