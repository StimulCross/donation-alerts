import { baseConfig, globs } from '@donation-alerts/eslint-configs';

/** @type import('eslint').Linter.Config[] */
export const config = [
	...baseConfig,
	{
		files: [...globs.ts],
		rules: {
			'node/no-unsupported-features/node-builtins': ['error', { version: '>=22.12.0', ignores: [] }],
		},
	},
	{
		files: [...globs.tsSpec],
		rules: {
			'@typescript-eslint/consistent-type-assertions': 'off',
		},
	},
];

export default config;
