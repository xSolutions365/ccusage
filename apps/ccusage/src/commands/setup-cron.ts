import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';
import { define } from 'gunshi';
import pc from 'picocolors';
import { log } from '../logger.ts';

const PLIST_LABEL = 'com.ccusage.daily';
const PLIST_FILENAME = `${PLIST_LABEL}.plist`;
const BINARY_PATH = join(homedir(), '.local', 'bin', 'ccusage');

/**
 * Generate the launchd plist XML content for macOS
 */
function generatePlist(): string {
	return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "https://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>Label</key>
	<string>${PLIST_LABEL}</string>
	<key>ProgramArguments</key>
	<array>
		<string>${BINARY_PATH}</string>
		<string>sync</string>
	</array>
	<key>StartCalendarInterval</key>
	<dict>
		<key>Hour</key>
		<integer>9</integer>
		<key>Minute</key>
		<integer>0</integer>
	</dict>
	<key>StandardOutPath</key>
	<string>${homedir()}/Library/Logs/ccusage-sync.log</string>
	<key>StandardErrorPath</key>
	<string>${homedir()}/Library/Logs/ccusage-sync-error.log</string>
	<key>EnvironmentVariables</key>
	<dict>
		<key>PATH</key>
		<string>/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin:${join(homedir(), '.local', 'bin')}</string>
	</dict>
	<key>RunAtLoad</key>
	<false/>
</dict>
</plist>`;
}

/**
 * Install the launchd plist for daily ccusage sync on macOS
 */
function installMacOSLaunchAgent(): void {
	const launchAgentsDir = join(homedir(), 'Library', 'LaunchAgents');
	const plistPath = join(launchAgentsDir, PLIST_FILENAME);

	if (!existsSync(launchAgentsDir)) {
		mkdirSync(launchAgentsDir, { recursive: true });
	}

	if (existsSync(plistPath)) {
		try {
			execSync(`launchctl unload "${plistPath}"`, { stdio: 'ignore' });
		} catch {
			// Ignore errors if not loaded
		}
	}

	writeFileSync(plistPath, generatePlist(), 'utf-8');

	try {
		execSync(`launchctl load "${plistPath}"`);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		log(pc.red(`Failed to load launch agent: ${message}`));
		process.exit(1);
	}

	log(pc.green('✓ Successfully installed ccusage daily sync job'));
	log('');
	log(`  ${pc.bold('Schedule:')} Every day at 9:00 AM`);
	log(`  ${pc.bold('Plist:')} ${plistPath}`);
	log(`  ${pc.bold('Logs:')} ~/Library/Logs/ccusage-sync.log`);
	log('');
	log(pc.dim(`To uninstall, run: launchctl unload "${plistPath}"`));
}

/**
 * Install a crontab entry for daily ccusage sync on Linux
 */
function installLinuxCron(): void {
	const cronEntry = `0 9 * * * ${BINARY_PATH} sync`;
	const marker = '# ccusage daily sync';

	let existing = '';
	try {
		existing = execSync('crontab -l 2>/dev/null', { encoding: 'utf-8' });
	} catch {
		// No existing crontab
	}

	// Remove any existing ccusage entry then append the new one
	const filtered = existing
		.split('\n')
		.filter((line) => !line.includes('ccusage sync') && !line.includes(marker))
		.join('\n')
		.trim();

	const updated =
		filtered !== '' ? `${filtered}\n${marker}\n${cronEntry}\n` : `${marker}\n${cronEntry}\n`;

	execSync(`echo ${JSON.stringify(updated)} | crontab -`);

	log(pc.green('✓ Successfully installed ccusage daily sync job'));
	log('');
	log(`  ${pc.bold('Schedule:')} Every day at 9:00 AM (cron)`);
	log(`  ${pc.bold('Entry:')} ${cronEntry}`);
	log('');
	log(pc.dim('To uninstall, run: crontab -e and remove the ccusage entry.'));
}

export const setupCronCommand = define({
	name: 'setup-cron-job',
	description: 'Install a system job to sync ccusage data daily (persists through reboots)',
	args: {},
	run() {
		if (process.platform === 'darwin') {
			installMacOSLaunchAgent();
		} else if (process.platform === 'linux') {
			installLinuxCron();
		} else {
			log(pc.red('Error: setup-cron-job is only supported on macOS and Linux'));
			process.exit(1);
		}
	},
});
