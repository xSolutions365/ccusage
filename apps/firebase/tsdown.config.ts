import { defineConfig } from 'tsdown';

export default defineConfig({
	entry: ['src/index.ts', 'src/function.ts'],
	outDir: 'dist',
	format: 'esm',
	external: ['@google-cloud/firestore', 'firebase-functions'],
	clean: true,
	sourcemap: false,
	minify: 'dce-only',
	treeshake: true,
	fixedExtension: false,
	dts: {
		tsgo: true,
	},
	unused: true,
	exports: {
		devExports: true,
	},
	nodeProtocol: true,
	define: {
		'import.meta.vitest': 'undefined',
	},
});
