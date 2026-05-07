import * as v from 'valibot';
import { usageReportRequestSchema } from './schemas.ts';

export type HandlerResult =
	| { success: true; reportType: string; data: v.InferOutput<typeof usageReportRequestSchema> }
	| { success: false; status: number; error: string; details?: string[] };

function formatValidationErrors(issues: v.BaseIssue<unknown>[]): string[] {
	return issues.map((issue) => {
		const path = issue.path?.map((p) => p.key).join('.') ?? 'root';
		return `${path}: ${issue.message}`;
	});
}

export function handleUsageReport(method: string, body: unknown): HandlerResult {
	if (method !== 'POST') {
		return { success: false, status: 405, error: 'Method not allowed. Use POST.' };
	}

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
