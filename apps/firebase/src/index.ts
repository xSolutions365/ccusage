/**
 * @fileoverview Firebase Cloud Function handler for receiving and storing ccusage statistics
 *
 * Exposes the core request handler logic that validates incoming usage report data
 * using strict Valibot schemas. This module is framework-agnostic and can be wired
 * to Firebase Cloud Functions, Express, or any HTTP handler.
 *
 * @module index
 */

import * as v from 'valibot';
import { usageReportRequestSchema } from './schemas.ts';

export type { UsageReportRequest } from './schemas.ts';
export { usageReportRequestSchema } from './schemas.ts';

/**
 * Result type for the usage report handler
 */
export type HandlerResult =
	| { success: true; reportType: string; data: v.InferOutput<typeof usageReportRequestSchema> }
	| { success: false; status: number; error: string; details?: string[] };

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
 * Core handler that validates an incoming usage report request body.
 *
 * Returns validated data on success, or error details on failure.
 * The caller is responsible for persisting to Firestore and returning HTTP responses.
 *
 * @param method - HTTP method of the request
 * @param body - Parsed JSON body of the request
 * @returns HandlerResult with validated data or error details
 */
export function handleUsageReport(method: string, body: unknown): HandlerResult {
	// Only allow POST
	if (method !== 'POST') {
		return { success: false, status: 405, error: 'Method not allowed. Use POST.' };
	}

	// Parse and validate the request body
	const result = v.safeParse(usageReportRequestSchema, body);

	if (!result.success) {
		return {
			success: false,
			status: 400,
			error: 'Validation failed',
			details: formatValidationErrors(result.issues),
		};
	}

	return {
		success: true,
		reportType: result.output.report.type,
		data: result.output,
	};
}

if (import.meta.vitest != null) {
	const { describe, it, expect } = import.meta.vitest;

	describe('handleUsageReport', () => {
		it('rejects non-POST methods', () => {
			const result = handleUsageReport('GET', {});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.status).toBe(405);
			}
		});

		it('rejects invalid body', () => {
			const result = handleUsageReport('POST', { invalid: true });
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.status).toBe(400);
				expect(result.details).toBeDefined();
			}
		});

		it('accepts valid daily report', () => {
			const body = {
				submittedAt: '2025-05-01T10:00:00Z',
				submitterId: 'user-123',
				report: {
					type: 'daily',
					daily: [
						{
							date: '2025-05-01',
							inputTokens: 1000,
							outputTokens: 500,
							cacheCreationTokens: 200,
							cacheReadTokens: 100,
							totalTokens: 1800,
							totalCost: 0.05,
							modelsUsed: ['claude-sonnet-4-20250514'],
							modelBreakdowns: [
								{
									modelName: 'claude-sonnet-4-20250514',
									inputTokens: 1000,
									outputTokens: 500,
									cacheCreationTokens: 200,
									cacheReadTokens: 100,
									cost: 0.05,
								},
							],
						},
					],
					totals: {
						inputTokens: 1000,
						outputTokens: 500,
						cacheCreationTokens: 200,
						cacheReadTokens: 100,
						totalCost: 0.05,
						totalTokens: 1800,
					},
				},
			};

			const result = handleUsageReport('POST', body);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.reportType).toBe('daily');
			}
		});
	});
}
