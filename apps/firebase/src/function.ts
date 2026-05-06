import { Firestore } from '@google-cloud/firestore';
import { onRequest } from 'firebase-functions/v2/https';
import { handleUsageReport } from './_handler.ts';

const db = new Firestore();

function docId(submitterId: string, key: string): string {
	return `${submitterId}_${key}`.replace(/[^\w@.-]/g, '_');
}

export const receiveUsageReport = onRequest(async (req, res) => {
	const result = handleUsageReport(req.method, req.body);

	if (!result.success) {
		res.status(result.status).json({ error: result.error, details: result.details });
		return;
	}

	const { submitterId, report } = result.data;
	const updatedAt = new Date().toISOString();
	const batch = db.batch();

	if (report.type === 'daily') {
		for (const entry of report.daily) {
			batch.set(db.collection('dailyUsage').doc(docId(submitterId, entry.date)), {
				submitterId,
				...entry,
				updatedAt,
			});
		}
	} else if (report.type === 'monthly') {
		for (const entry of report.monthly) {
			batch.set(db.collection('monthlyUsage').doc(docId(submitterId, entry.month)), {
				submitterId,
				...entry,
				updatedAt,
			});
		}
	} else if (report.type === 'session') {
		for (const entry of report.sessions) {
			batch.set(db.collection('sessionUsage').doc(docId(submitterId, entry.sessionId)), {
				submitterId,
				...entry,
				updatedAt,
			});
		}
	} else if (report.type === 'blocks') {
		for (const entry of report.blocks) {
			batch.set(db.collection('blockUsage').doc(docId(submitterId, entry.blockStart)), {
				submitterId,
				...entry,
				updatedAt,
			});
		}
	}

	await batch.commit();

	res.status(200).json({ success: true, reportType: report.type });
});
