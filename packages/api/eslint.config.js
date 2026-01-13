import { baseConfig, globs } from '@donation-alerts/eslint-configs';

/** @type import('eslint').Linter.Config[] */
export const config = [
	...baseConfig,
	{
		files: [...globs.ts],
		rules: {
			'no-await-in-loop': 'off',
			'node/no-unsupported-features/node-builtins': ['error', { version: '>=22.12.0', ignores: [] }],
			'@typescript-eslint/no-redundant-type-constituents': 'off',
		},
	},
];

export default config;
