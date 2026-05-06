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

/**
 * Get the current macOS username
 */
function getUsername(): string {
	if (process.env.USER != null && process.env.USER !== '') {
		return process.env.USER;
	}
	try {
		return execSync('whoami').toString().trim();
	} catch {
		log(pc.yellow('Warning: Could not determine username, using "unknown"'));
		return 'unknown';
	}
}

/**
 * Find the path to npx binary
 */
function getNpxPath(): string {
	try {
		return execSync('which npx').toString().trim();
	} catch {
		log(pc.yellow('Warning: npx not found in PATH, using fallback /usr/local/bin/npx'));
		return '/usr/local/bin/npx';
	}
}

/**
 * Generate the launchd plist XML content
 */
function generatePlist(npxPath: string, username: string): string {
	return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "https://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>Label</key>
	<string>${PLIST_LABEL}</string>
	<key>ProgramArguments</key>
	<array>
		<string>${npxPath}</string>
		<string>ccusage@latest</string>
		<string>daily</string>
		<string>--json</string>
	</array>
	<key>StartCalendarInterval</key>
	<dict>
		<key>Hour</key>
		<integer>9</integer>
		<key>Minute</key>
		<integer>0</integer>
	</dict>
	<key>StandardOutPath</key>
	<string>${homedir()}/Library/Logs/ccusage-daily.log</string>
	<key>StandardErrorPath</key>
	<string>${homedir()}/Library/Logs/ccusage-daily-error.log</string>
	<key>EnvironmentVariables</key>
	<dict>
		<key>PATH</key>
		<string>/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin</string>
		<key>CCUSAGE_USERNAME</key>
		<string>${username}</string>
	</dict>
	<key>RunAtLoad</key>
	<false/>
</dict>
</plist>`;
}

/**
 * Install the launchd plist for daily ccusage execution
 */
function installLaunchAgent(): void {
	const username = getUsername();
	const npxPath = getNpxPath();
	const launchAgentsDir = join(homedir(), 'Library', 'LaunchAgents');
	const plistPath = join(launchAgentsDir, PLIST_FILENAME);

	// Ensure LaunchAgents directory exists
	if (!existsSync(launchAgentsDir)) {
		mkdirSync(launchAgentsDir, { recursive: true });
	}

	// Unload existing plist if present
	if (existsSync(plistPath)) {
		try {
			execSync(`launchctl unload "${plistPath}"`, { stdio: 'ignore' });
		} catch {
			// Ignore errors if not loaded
		}
	}

	// Write the plist file
	const plistContent = generatePlist(npxPath, username);
	writeFileSync(plistPath, plistContent, 'utf-8');

	// Load the plist
	try {
		execSync(`launchctl load "${plistPath}"`);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		log(pc.red(`Failed to load launch agent: ${message}`));
		process.exit(1);
	}

	log(pc.green('✓ Successfully installed ccusage daily cron job'));
	log('');
	log(`  ${pc.bold('Schedule:')} Every day at 9:00 AM`);
	log(`  ${pc.bold('Username:')} ${username}`);
	log(`  ${pc.bold('Plist:')} ${plistPath}`);
	log(`  ${pc.bold('Logs:')} ~/Library/Logs/ccusage-daily.log`);
	log('');
	log(pc.dim('The job persists through reboots and runs `npx ccusage@latest daily --json`.'));
	log(pc.dim(`To uninstall, run: launchctl unload "${plistPath}"`));
}

export const setupCronCommand = define({
	name: 'setup-cron-job',
	description: 'Install a macOS launchd agent to run ccusage daily (persists through reboots)',
	args: {},
	run() {
		if (process.platform !== 'darwin') {
			log(pc.red('Error: setup-cron-job is only supported on macOS'));
			process.exit(1);
		}

		installLaunchAgent();
	},
});
