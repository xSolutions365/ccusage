/**
 * @fileoverview Firebase Cloud Function for receiving and storing ccusage statistics
 *
 * Exposes an HTTPS callable function that validates incoming usage report data
 * using strict Valibot schemas and stores it in Firestore.
 *
 * @module index
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { onRequest } from 'firebase-functions/v2/https';
import * as v from 'valibot';
import { usageReportRequestSchema } from './schemas.ts';

initializeApp();

/**
 * Formats Valibot validation issues into a readable array of error messages
 */
function formatValidationErrors(issues: v.BaseIssue<unknown>[]): string[] {
	return issues.map((issue) => {
		const path = issue.path?.map((p) => p.key).join('.') ?? 'root';
		return `${path}: ${issue.message}`;
	});
}

/**
 * HTTPS Cloud Function that receives ccusage statistics and stores them in Firestore.
 *
 * Expects a POST request with a JSON body conforming to the UsageReportRequest schema.
 * Performs strict schema validation before writing to Firestore.
 *
 * Firestore collection: "usageReports"
 * Document structure: validated payload + serverTimestamp
 */
export const submitUsageReport = onRequest(async (req, res) => {
	// Only allow POST
	if (req.method !== 'POST') {
		res.status(405).json({ error: 'Method not allowed. Use POST.' });
		return;
	}

	// Parse and validate the request body
	const result = v.safeParse(usageReportRequestSchema, req.body);

	if (!result.success) {
		res.status(400).json({
			error: 'Validation failed',
			details: formatValidationErrors(result.issues),
		});
		return;
	}

	const validatedData = result.output;

	// Store in Firestore
	const db = getFirestore();
	const docRef = await db.collection('usageReports').add({
		...validatedData,
		_metadata: {
			receivedAt: new Date().toISOString(),
			reportType: validatedData.report.type,
		},
	});

	res.status(201).json({
		success: true,
		documentId: docRef.id,
		reportType: validatedData.report.type,
	});
});
