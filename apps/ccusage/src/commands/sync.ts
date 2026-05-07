import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';
import { define } from 'gunshi';
import pc from 'picocolors';
import { calculateTotals, createTotalsObject } from '../calculate-cost.ts';
import { loadDailyUsageData } from '../data-loader.ts';
import { log } from '../logger.ts';

const AUTH_CONFIG_PATH = join(homedir(), '.config', 'ccusage', 'auth.json');

type AuthConfig = {
	token: string;
	endpoint: string;
};

function loadAuthConfig(): AuthConfig | null {
	if (!existsSync(AUTH_CONFIG_PATH)) {
		return null;
	}
	try {
		const content = readFileSync(AUTH_CONFIG_PATH, 'utf-8');
		const data = JSON.parse(content) as unknown;
		if (
			typeof data === 'object' &&
			data !== null &&
			typeof (data as Record<string, unknown>).token === 'string' &&
			typeof (data as Record<string, unknown>).endpoint === 'string'
		) {
			return data as AuthConfig;
		}
		return null;
	} catch {
		return null;
	}
}

export const syncCommand = define({
	name: 'sync',
	description: 'Sync usage data to the configured ccusage API endpoint',
	args: {},
	async run() {
		const auth = loadAuthConfig();
		if (auth == null) {
			log(pc.red(`Error: No auth config found at ${AUTH_CONFIG_PATH}`));
			log(pc.dim('Run the installer to set up authentication.'));
			process.exit(1);
		}

		const dailyData = await loadDailyUsageData();
		if (dailyData.length === 0) {
			log('No usage data found to sync.');
			return;
		}

		const rawTotals = calculateTotals(dailyData);
		const totals = createTotalsObject(rawTotals);

		const payload = {
			submittedAt: new Date().toISOString(),
			report: {
				type: 'daily' as const,
				daily: dailyData.map((entry) => ({
					date: entry.date,
					inputTokens: Math.round(entry.inputTokens),
					outputTokens: Math.round(entry.outputTokens),
					cacheCreationTokens: Math.round(entry.cacheCreationTokens),
					cacheReadTokens: Math.round(entry.cacheReadTokens),
					totalTokens: Math.round(
						entry.inputTokens +
							entry.outputTokens +
							entry.cacheCreationTokens +
							entry.cacheReadTokens,
					),
					totalCost: entry.totalCost,
					modelsUsed: entry.modelsUsed,
					modelBreakdowns: entry.modelBreakdowns.map((mb) => ({
						modelName: mb.modelName,
						inputTokens: Math.round(mb.inputTokens),
						outputTokens: Math.round(mb.outputTokens),
						cacheCreationTokens: Math.round(mb.cacheCreationTokens),
						cacheReadTokens: Math.round(mb.cacheReadTokens),
						cost: mb.cost,
					})),
					...(entry.project != null ? { project: entry.project } : {}),
				})),
				totals: {
					inputTokens: Math.round(totals.inputTokens),
					outputTokens: Math.round(totals.outputTokens),
					cacheCreationTokens: Math.round(totals.cacheCreationTokens),
					cacheReadTokens: Math.round(totals.cacheReadTokens),
					totalCost: totals.totalCost,
					totalTokens: Math.round(totals.totalTokens),
				},
			},
		};

		const response = await fetch(auth.endpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-ccusage-token': auth.token,
			},
			body: JSON.stringify(payload),
		});

		if (!response.ok) {
			const errorText = await response.text().catch(() => 'Unknown error');
			log(pc.red(`Error: Failed to sync usage data (${response.status}): ${errorText}`));
			process.exit(1);
		}

		log(pc.green(`✓ Synced ${dailyData.length} days of usage data to ${auth.endpoint}`));
	},
});
