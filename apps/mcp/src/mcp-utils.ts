import type { LoadOptions } from '@xsolutions365/ccusage/data-loader';
import { getClaudePaths } from '@xsolutions365/ccusage/data-loader';

export function defaultOptions(): LoadOptions {
	const paths = getClaudePaths();
	if (paths.length === 0) {
		throw new Error(
			'No valid Claude path found. Ensure getClaudePaths() returns at least one valid path.',
		);
	}
	return { claudePath: paths[0] } as const satisfies LoadOptions;
}
