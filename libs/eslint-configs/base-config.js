import { resolveFlatConfig } from '@leancodepl/resolve-eslint-flat-config';
import node from '@stimulcross/eslint-config-node';
import nodeStyle from '@stimulcross/eslint-config-node/style';
import typescript from '@stimulcross/eslint-config-typescript';
import typescriptStyle from '@stimulcross/eslint-config-typescript/style';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import { createExcludeFilter, extendNamingConvention, matchRule } from './extend-naming-convention.js';
import { globs } from './globs.js';

const BASE_MEMBER_NAMES = [
	'^toJSON$',
	'^Centrifuge$',
	'^user_id$',
	'^(access|refresh)_token$',
	'^expires_in$',
	'^grant_type$',
	'^client_(id|secret)$',
	'^redirect_uri$',
	'^external_id$',
	'^(img|image|sound)_url$',
	'^is_(shown|active|percentage|winner)$',
	'^(shown|created|end|started|expires)_at$',
	'^end_at_ts$',
	'^message_type$',
	'^price_(user|service)$',
	'^bought_amount$',
	'^socket_connection_token$',
	'^allow_user_options$',
	'^amount_(value|percent)$',
	'^(start|raised|goal)_amount$',
	'^(merchant|merchandise)_identifier',
	'^(per|last|current)_page',
	'^[a-z]{2}_[A-Z]{2}$',
];

export const baseNamingConvention = extendNamingConvention(
	typescriptStyle.rules['@typescript-eslint/naming-convention'],
	[
		{
			when: rule => matchRule(rule, { selector: 'default' }) && !rule.modifiers,
			apply: rule => ({
				...rule,
				filter: createExcludeFilter(BASE_MEMBER_NAMES),
			}),
		},
		{
			when: rule => matchRule(rule, { selector: 'memberLike' }) && !rule.modifiers,
			apply: rule => ({
				...rule,
				filter: createExcludeFilter(BASE_MEMBER_NAMES),
			}),
		},
	],
);

/** @type {import("eslint").Linter.Config[]} */
export const baseConfig = resolveFlatConfig(
	defineConfig(
		globalIgnores([globs.lib, globs.nodeModules, globs.dts, globs.coverage]),
		{
			files: [...globs.js, ...globs.ts, ...globs.jsSpec, ...globs.tsSpec],
			languageOptions: {
				globals: {
					...globals.node,
					...globals.es2022,
				},
			},
		},
		{
			files: [...globs.js, ...globs.ts],
			extends: [node, nodeStyle, typescript, typescriptStyle],
		},
		// {
		// 	...node,
		// 	files: [...globs.js, ...globs.ts],
		// },
		// {
		// 	...nodeStyle,
		// 	files: [...globs.js, ...globs.ts],
		// },
		// {
		// 	...typescript,
		// 	files: [...globs.ts],
		// },
		// {
		// 	...typescriptStyle,
		// 	files: [...globs.ts],
		// },
		{
			files: [...globs.ts, ...globs.tsSpec],
			rules: {
				'func-names': 'off',
				'new-cap': 'off',
				'no-await-in-loop': 'off',
				'unicorn/prefer-event-target': 'off',
				'@typescript-eslint/class-literal-property-style': 'off',
				'@typescript-eslint/no-non-null-assertion': 'off',
				'@typescript-eslint/naming-convention': baseNamingConvention,
			},
		},
		{
			files: [...globs.tsSpec],
			rules: {
				'max-classes-per-file': 'off',
				'id-length': 'off',
				'import/no-extraneous-dependencies': 'off',
				'unicorn/no-useless-undefined': 'off',
				'@typescript-eslint/no-empty-function': 'off',
				'@typescript-eslint/no-explicit-any': 'off',
				'@typescript-eslint/no-unsafe-assignment': 'off',
				'@typescript-eslint/no-unsafe-call': 'off',
				'@typescript-eslint/no-unsafe-member-access': 'off',
			},
		},
	),
);
