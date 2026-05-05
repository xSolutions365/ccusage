/**
 * @fileoverview Strict Valibot schemas for ccusage statistics data
 *
 * Defines the validation schemas for usage data submitted to the Firebase backend.
 * These schemas mirror the statistics output by ccusage (daily, session, monthly, blocks)
 * with strict validation to ensure data integrity in Firestore.
 *
 * @module schemas
 */

import * as v from 'valibot';

/**
 * Schema for model-specific usage breakdown
 */
export const modelBreakdownSchema = v.object({
	modelName: v.pipe(v.string(), v.minLength(1, 'Model name cannot be empty')),
	inputTokens: v.pipe(v.number(), v.integer(), v.minValue(0)),
	outputTokens: v.pipe(v.number(), v.integer(), v.minValue(0)),
	cacheCreationTokens: v.pipe(v.number(), v.integer(), v.minValue(0)),
	cacheReadTokens: v.pipe(v.number(), v.integer(), v.minValue(0)),
	cost: v.pipe(v.number(), v.minValue(0)),
});

/**
 * Schema for aggregated token totals
 */
const totalsSchema = v.object({
	inputTokens: v.pipe(v.number(), v.integer(), v.minValue(0)),
	outputTokens: v.pipe(v.number(), v.integer(), v.minValue(0)),
	cacheCreationTokens: v.pipe(v.number(), v.integer(), v.minValue(0)),
	cacheReadTokens: v.pipe(v.number(), v.integer(), v.minValue(0)),
	totalCost: v.pipe(v.number(), v.minValue(0)),
	totalTokens: v.pipe(v.number(), v.integer(), v.minValue(0)),
});

/**
 * Schema for a single daily usage entry
 */
export const dailyEntrySchema = v.object({
	date: v.pipe(
		v.string(),
		v.regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
	),
	inputTokens: v.pipe(v.number(), v.integer(), v.minValue(0)),
	outputTokens: v.pipe(v.number(), v.integer(), v.minValue(0)),
	cacheCreationTokens: v.pipe(v.number(), v.integer(), v.minValue(0)),
	cacheReadTokens: v.pipe(v.number(), v.integer(), v.minValue(0)),
	totalTokens: v.pipe(v.number(), v.integer(), v.minValue(0)),
	totalCost: v.pipe(v.number(), v.minValue(0)),
	modelsUsed: v.array(v.pipe(v.string(), v.minLength(1))),
	modelBreakdowns: v.array(modelBreakdownSchema),
	project: v.optional(v.string()),
});

/**
 * Schema for a single session usage entry
 */
export const sessionEntrySchema = v.object({
	sessionId: v.pipe(v.string(), v.minLength(1, 'Session ID cannot be empty')),
	projectPath: v.pipe(v.string(), v.minLength(1, 'Project path cannot be empty')),
	inputTokens: v.pipe(v.number(), v.integer(), v.minValue(0)),
	outputTokens: v.pipe(v.number(), v.integer(), v.minValue(0)),
	cacheCreationTokens: v.pipe(v.number(), v.integer(), v.minValue(0)),
	cacheReadTokens: v.pipe(v.number(), v.integer(), v.minValue(0)),
	totalCost: v.pipe(v.number(), v.minValue(0)),
	lastActivity: v.pipe(
		v.string(),
		v.regex(/^\d{4}-\d{2}-\d{2}$/, 'Last activity must be in YYYY-MM-DD format'),
	),
	versions: v.array(v.pipe(v.string(), v.regex(/^\d+\.\d+\.\d+/, 'Invalid version format'))),
	modelsUsed: v.array(v.pipe(v.string(), v.minLength(1))),
	modelBreakdowns: v.array(modelBreakdownSchema),
});

/**
 * Schema for a single monthly usage entry
 */
export const monthlyEntrySchema = v.object({
	month: v.pipe(
		v.string(),
		v.regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'),
	),
	inputTokens: v.pipe(v.number(), v.integer(), v.minValue(0)),
	outputTokens: v.pipe(v.number(), v.integer(), v.minValue(0)),
	cacheCreationTokens: v.pipe(v.number(), v.integer(), v.minValue(0)),
	cacheReadTokens: v.pipe(v.number(), v.integer(), v.minValue(0)),
	totalCost: v.pipe(v.number(), v.minValue(0)),
	modelsUsed: v.array(v.pipe(v.string(), v.minLength(1))),
	modelBreakdowns: v.array(modelBreakdownSchema),
	project: v.optional(v.string()),
});

/**
 * Schema for a single block usage entry (5-hour billing cycle)
 */
export const blockEntrySchema = v.object({
	blockStart: v.pipe(
		v.string(),
		v.regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/, 'Invalid ISO timestamp'),
	),
	blockEnd: v.pipe(
		v.string(),
		v.regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/, 'Invalid ISO timestamp'),
	),
	inputTokens: v.pipe(v.number(), v.integer(), v.minValue(0)),
	outputTokens: v.pipe(v.number(), v.integer(), v.minValue(0)),
	cacheCreationTokens: v.pipe(v.number(), v.integer(), v.minValue(0)),
	cacheReadTokens: v.pipe(v.number(), v.integer(), v.minValue(0)),
	totalTokens: v.pipe(v.number(), v.integer(), v.minValue(0)),
	totalCost: v.pipe(v.number(), v.minValue(0)),
	modelsUsed: v.array(v.pipe(v.string(), v.minLength(1))),
	modelBreakdowns: v.array(modelBreakdownSchema),
	isActive: v.boolean(),
});

/**
 * Schema for daily usage report payload
 */
export const dailyReportSchema = v.object({
	type: v.literal('daily'),
	daily: v.pipe(v.array(dailyEntrySchema), v.minLength(1, 'At least one daily entry is required')),
	totals: totalsSchema,
});

/**
 * Schema for session usage report payload
 */
export const sessionReportSchema = v.object({
	type: v.literal('session'),
	sessions: v.pipe(
		v.array(sessionEntrySchema),
		v.minLength(1, 'At least one session entry is required'),
	),
	totals: totalsSchema,
});

/**
 * Schema for monthly usage report payload
 */
export const monthlyReportSchema = v.object({
	type: v.literal('monthly'),
	monthly: v.pipe(
		v.array(monthlyEntrySchema),
		v.minLength(1, 'At least one monthly entry is required'),
	),
	totals: totalsSchema,
});

/**
 * Schema for blocks usage report payload
 */
export const blocksReportSchema = v.object({
	type: v.literal('blocks'),
	blocks: v.pipe(
		v.array(blockEntrySchema),
		v.minLength(1, 'At least one block entry is required'),
	),
});

/**
 * Top-level request schema with metadata and usage report data
 */
export const usageReportRequestSchema = v.object({
	/** ISO 8601 timestamp of when this report was generated */
	submittedAt: v.pipe(
		v.string(),
		v.regex(
			/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/,
			'submittedAt must be a valid ISO timestamp',
		),
	),
	/** Identifier for the user or machine submitting the report */
	submitterId: v.pipe(v.string(), v.minLength(1, 'Submitter ID cannot be empty')),
	/** The usage report data - one of daily, session, monthly, or blocks */
	report: v.variant('type', [
		dailyReportSchema,
		sessionReportSchema,
		monthlyReportSchema,
		blocksReportSchema,
	]),
});

/**
 * Inferred types from schemas
 */
export type ModelBreakdown = v.InferOutput<typeof modelBreakdownSchema>;
export type DailyEntry = v.InferOutput<typeof dailyEntrySchema>;
export type SessionEntry = v.InferOutput<typeof sessionEntrySchema>;
export type MonthlyEntry = v.InferOutput<typeof monthlyEntrySchema>;
export type BlockEntry = v.InferOutput<typeof blockEntrySchema>;
export type DailyReport = v.InferOutput<typeof dailyReportSchema>;
export type SessionReport = v.InferOutput<typeof sessionReportSchema>;
export type MonthlyReport = v.InferOutput<typeof monthlyReportSchema>;
export type BlocksReport = v.InferOutput<typeof blocksReportSchema>;
export type UsageReportRequest = v.InferOutput<typeof usageReportRequestSchema>;

if (import.meta.vitest != null) {
	const { describe, it, expect } = import.meta.vitest;

	describe('usageReportRequestSchema', () => {
		it('validates a valid daily report', () => {
			const validPayload = {
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

			const result = v.safeParse(usageReportRequestSchema, validPayload);
			expect(result.success).toBe(true);
		});

		it('validates a valid session report', () => {
			const validPayload = {
				submittedAt: '2025-05-01T10:00:00Z',
				submitterId: 'user-456',
				report: {
					type: 'session',
					sessions: [
						{
							sessionId: 'sess-abc123',
							projectPath: '/home/user/project',
							inputTokens: 2000,
							outputTokens: 800,
							cacheCreationTokens: 300,
							cacheReadTokens: 150,
							totalCost: 0.08,
							lastActivity: '2025-05-01',
							versions: ['1.0.0'],
							modelsUsed: ['claude-opus-4-20250514'],
							modelBreakdowns: [
								{
									modelName: 'claude-opus-4-20250514',
									inputTokens: 2000,
									outputTokens: 800,
									cacheCreationTokens: 300,
									cacheReadTokens: 150,
									cost: 0.08,
								},
							],
						},
					],
					totals: {
						inputTokens: 2000,
						outputTokens: 800,
						cacheCreationTokens: 300,
						cacheReadTokens: 150,
						totalCost: 0.08,
						totalTokens: 3250,
					},
				},
			};

			const result = v.safeParse(usageReportRequestSchema, validPayload);
			expect(result.success).toBe(true);
		});

		it('validates a valid monthly report', () => {
			const validPayload = {
				submittedAt: '2025-05-01T10:00:00Z',
				submitterId: 'user-789',
				report: {
					type: 'monthly',
					monthly: [
						{
							month: '2025-05',
							inputTokens: 50000,
							outputTokens: 20000,
							cacheCreationTokens: 5000,
							cacheReadTokens: 3000,
							totalCost: 2.5,
							modelsUsed: ['claude-sonnet-4-20250514'],
							modelBreakdowns: [
								{
									modelName: 'claude-sonnet-4-20250514',
									inputTokens: 50000,
									outputTokens: 20000,
									cacheCreationTokens: 5000,
									cacheReadTokens: 3000,
									cost: 2.5,
								},
							],
						},
					],
					totals: {
						inputTokens: 50000,
						outputTokens: 20000,
						cacheCreationTokens: 5000,
						cacheReadTokens: 3000,
						totalCost: 2.5,
						totalTokens: 78000,
					},
				},
			};

			const result = v.safeParse(usageReportRequestSchema, validPayload);
			expect(result.success).toBe(true);
		});

		it('validates a valid blocks report', () => {
			const validPayload = {
				submittedAt: '2025-05-01T10:00:00Z',
				submitterId: 'user-abc',
				report: {
					type: 'blocks',
					blocks: [
						{
							blockStart: '2025-05-01T00:00:00Z',
							blockEnd: '2025-05-01T05:00:00Z',
							inputTokens: 10000,
							outputTokens: 4000,
							cacheCreationTokens: 1000,
							cacheReadTokens: 500,
							totalTokens: 15500,
							totalCost: 0.75,
							modelsUsed: ['claude-sonnet-4-20250514'],
							modelBreakdowns: [
								{
									modelName: 'claude-sonnet-4-20250514',
									inputTokens: 10000,
									outputTokens: 4000,
									cacheCreationTokens: 1000,
									cacheReadTokens: 500,
									cost: 0.75,
								},
							],
							isActive: false,
						},
					],
				},
			};

			const result = v.safeParse(usageReportRequestSchema, validPayload);
			expect(result.success).toBe(true);
		});

		it('rejects missing submittedAt', () => {
			const invalid = {
				submitterId: 'user-123',
				report: {
					type: 'daily',
					daily: [
						{
							date: '2025-05-01',
							inputTokens: 0,
							outputTokens: 0,
							cacheCreationTokens: 0,
							cacheReadTokens: 0,
							totalTokens: 0,
							totalCost: 0,
							modelsUsed: [],
							modelBreakdowns: [],
						},
					],
					totals: {
						inputTokens: 0,
						outputTokens: 0,
						cacheCreationTokens: 0,
						cacheReadTokens: 0,
						totalCost: 0,
						totalTokens: 0,
					},
				},
			};

			const result = v.safeParse(usageReportRequestSchema, invalid);
			expect(result.success).toBe(false);
		});

		it('rejects invalid date format in daily entry', () => {
			const invalid = {
				submittedAt: '2025-05-01T10:00:00Z',
				submitterId: 'user-123',
				report: {
					type: 'daily',
					daily: [
						{
							date: '05/01/2025', // wrong format
							inputTokens: 0,
							outputTokens: 0,
							cacheCreationTokens: 0,
							cacheReadTokens: 0,
							totalTokens: 0,
							totalCost: 0,
							modelsUsed: [],
							modelBreakdowns: [],
						},
					],
					totals: {
						inputTokens: 0,
						outputTokens: 0,
						cacheCreationTokens: 0,
						cacheReadTokens: 0,
						totalCost: 0,
						totalTokens: 0,
					},
				},
			};

			const result = v.safeParse(usageReportRequestSchema, invalid);
			expect(result.success).toBe(false);
		});

		it('rejects negative token counts', () => {
			const invalid = {
				submittedAt: '2025-05-01T10:00:00Z',
				submitterId: 'user-123',
				report: {
					type: 'daily',
					daily: [
						{
							date: '2025-05-01',
							inputTokens: -100, // negative
							outputTokens: 0,
							cacheCreationTokens: 0,
							cacheReadTokens: 0,
							totalTokens: 0,
							totalCost: 0,
							modelsUsed: [],
							modelBreakdowns: [],
						},
					],
					totals: {
						inputTokens: 0,
						outputTokens: 0,
						cacheCreationTokens: 0,
						cacheReadTokens: 0,
						totalCost: 0,
						totalTokens: 0,
					},
				},
			};

			const result = v.safeParse(usageReportRequestSchema, invalid);
			expect(result.success).toBe(false);
		});

		it('rejects empty submitterId', () => {
			const invalid = {
				submittedAt: '2025-05-01T10:00:00Z',
				submitterId: '',
				report: {
					type: 'daily',
					daily: [
						{
							date: '2025-05-01',
							inputTokens: 0,
							outputTokens: 0,
							cacheCreationTokens: 0,
							cacheReadTokens: 0,
							totalTokens: 0,
							totalCost: 0,
							modelsUsed: [],
							modelBreakdowns: [],
						},
					],
					totals: {
						inputTokens: 0,
						outputTokens: 0,
						cacheCreationTokens: 0,
						cacheReadTokens: 0,
						totalCost: 0,
						totalTokens: 0,
					},
				},
			};

			const result = v.safeParse(usageReportRequestSchema, invalid);
			expect(result.success).toBe(false);
		});

		it('rejects invalid report type', () => {
			const invalid = {
				submittedAt: '2025-05-01T10:00:00Z',
				submitterId: 'user-123',
				report: {
					type: 'invalid',
					data: [],
				},
			};

			const result = v.safeParse(usageReportRequestSchema, invalid);
			expect(result.success).toBe(false);
		});

		it('rejects empty daily array', () => {
			const invalid = {
				submittedAt: '2025-05-01T10:00:00Z',
				submitterId: 'user-123',
				report: {
					type: 'daily',
					daily: [], // empty - must have at least 1
					totals: {
						inputTokens: 0,
						outputTokens: 0,
						cacheCreationTokens: 0,
						cacheReadTokens: 0,
						totalCost: 0,
						totalTokens: 0,
					},
				},
			};

			const result = v.safeParse(usageReportRequestSchema, invalid);
			expect(result.success).toBe(false);
		});

		it('rejects non-integer token values', () => {
			const invalid = {
				submittedAt: '2025-05-01T10:00:00Z',
				submitterId: 'user-123',
				report: {
					type: 'daily',
					daily: [
						{
							date: '2025-05-01',
							inputTokens: 10.5, // not integer
							outputTokens: 0,
							cacheCreationTokens: 0,
							cacheReadTokens: 0,
							totalTokens: 0,
							totalCost: 0,
							modelsUsed: [],
							modelBreakdowns: [],
						},
					],
					totals: {
						inputTokens: 0,
						outputTokens: 0,
						cacheCreationTokens: 0,
						cacheReadTokens: 0,
						totalCost: 0,
						totalTokens: 0,
					},
				},
			};

			const result = v.safeParse(usageReportRequestSchema, invalid);
			expect(result.success).toBe(false);
		});

		it('rejects invalid month format in monthly entry', () => {
			const invalid = {
				submittedAt: '2025-05-01T10:00:00Z',
				submitterId: 'user-123',
				report: {
					type: 'monthly',
					monthly: [
						{
							month: '2025-5', // should be 2025-05
							inputTokens: 0,
							outputTokens: 0,
							cacheCreationTokens: 0,
							cacheReadTokens: 0,
							totalCost: 0,
							modelsUsed: [],
							modelBreakdowns: [],
						},
					],
					totals: {
						inputTokens: 0,
						outputTokens: 0,
						cacheCreationTokens: 0,
						cacheReadTokens: 0,
						totalCost: 0,
						totalTokens: 0,
					},
				},
			};

			const result = v.safeParse(usageReportRequestSchema, invalid);
			expect(result.success).toBe(false);
		});

		it('rejects empty model name in modelBreakdowns', () => {
			const invalid = {
				submittedAt: '2025-05-01T10:00:00Z',
				submitterId: 'user-123',
				report: {
					type: 'daily',
					daily: [
						{
							date: '2025-05-01',
							inputTokens: 100,
							outputTokens: 50,
							cacheCreationTokens: 0,
							cacheReadTokens: 0,
							totalTokens: 150,
							totalCost: 0.01,
							modelsUsed: ['claude-sonnet-4-20250514'],
							modelBreakdowns: [
								{
									modelName: '', // empty - invalid
									inputTokens: 100,
									outputTokens: 50,
									cacheCreationTokens: 0,
									cacheReadTokens: 0,
									cost: 0.01,
								},
							],
						},
					],
					totals: {
						inputTokens: 100,
						outputTokens: 50,
						cacheCreationTokens: 0,
						cacheReadTokens: 0,
						totalCost: 0.01,
						totalTokens: 150,
					},
				},
			};

			const result = v.safeParse(usageReportRequestSchema, invalid);
			expect(result.success).toBe(false);
		});
	});
}
