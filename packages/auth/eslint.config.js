import { baseConfig, globs } from '@donation-alerts/eslint-configs';

/** @type import('eslint').Linter.Config[] */
export const config = [
	...baseConfig,
	{
		files: [...globs.ts],
		rules: {
			'unicorn/prefer-event-target': 'off',
		},
	},
];

export default config;
