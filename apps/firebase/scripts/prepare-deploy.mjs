import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const pkgDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(pkgDir, '..', '..', 'firebase-deploy');

mkdirSync(outDir, { recursive: true });
execSync(`rm -rf ${outDir}/dist`);
execSync(`cp -r ${join(pkgDir, 'dist')} ${outDir}/dist`);

const pkg = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8'));

writeFileSync(
	join(outDir, 'package.json'),
	`${JSON.stringify(
		{
			name: pkg.name,
			type: pkg.type,
			version: pkg.version,
			main: './dist/index.js',
			engines: pkg.engines,
			dependencies: pkg.dependencies,
		},
		null,
		'\t',
	)}\n`,
);

execSync('npm install --omit=dev --no-package-lock', { cwd: outDir, stdio: 'inherit' });

console.log('Firebase deploy directory prepared at apps/firebase-out');
