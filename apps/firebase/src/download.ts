import { Buffer } from 'node:buffer';
import { Firestore } from '@google-cloud/firestore';
import { defineSecret } from 'firebase-functions/params';
import { onRequest } from 'firebase-functions/v2/https';

const db = new Firestore();
const githubPat = defineSecret('GITHUB_DOWNLOAD_PAT');

const VALID_PLATFORMS = new Set(['darwin-arm64', 'darwin-x64', 'linux-arm64', 'linux-x64']);

export const download = onRequest(
	{ invoker: 'public', secrets: [githubPat], memory: '256MiB', timeoutSeconds: 60 },
	async (req, res) => {
		const query = req.query as Record<string, string | undefined>;
		const { token, platform } = query;

		if (token == null || token === '') {
			res.status(400).json({ error: 'Missing token parameter' });
			return;
		}

		if (platform == null || !VALID_PLATFORMS.has(platform)) {
			res
				.status(400)
				.json({ error: `Invalid platform. Must be one of: ${[...VALID_PLATFORMS].join(', ')}` });
			return;
		}

		const tokenDoc = await db.collection('tokens').doc(token).get();
		if (!tokenDoc.exists) {
			res.status(401).json({ error: 'Invalid token' });
			return;
		}

		const pat = githubPat.value();

		const releaseRes = await fetch(
			'https://api.github.com/repos/xSolutions365/ccusage/releases/latest',
			{
				headers: {
					Authorization: `Bearer ${pat}`,
					Accept: 'application/vnd.github+json',
					'X-GitHub-Api-Version': '2022-11-28',
					'User-Agent': 'ccusage-installer',
				},
			},
		);

		if (!releaseRes.ok) {
			res.status(502).json({ error: 'Failed to fetch release info from GitHub' });
			return;
		}

		const release = (await releaseRes.json()) as { assets: Array<{ name: string; url: string }> };
		const assetName = `ccusage-${platform}`;
		const asset = release.assets.find((a) => a.name === assetName);

		if (asset == null) {
			res.status(404).json({ error: `No binary found for platform: ${platform}` });
			return;
		}

		const binaryRes = await fetch(asset.url, {
			headers: {
				Authorization: `Bearer ${pat}`,
				Accept: 'application/octet-stream',
				'User-Agent': 'ccusage-installer',
			},
		});

		if (!binaryRes.ok) {
			res.status(502).json({ error: 'Failed to download binary from GitHub' });
			return;
		}

		const buffer = await binaryRes.arrayBuffer();
		res.setHeader('Content-Type', 'application/octet-stream');
		res.setHeader('Content-Disposition', 'attachment; filename="ccusage"');
		res.status(200).send(Buffer.from(buffer));
	},
);
