import node from '@stimulcross/eslint-config-node';
import nodeStyle from '@stimulcross/eslint-config-node/style';
import typescript from '@stimulcross/eslint-config-typescript';
import typescriptStyle from '@stimulcross/eslint-config-typescript/style';

const packagesDir = 'packages';

const globs = {
	js: [`${packagesDir}/**/*.js`, `${packagesDir}/**/*.cjs`, `${packagesDir}/**/*.mjs`],
	ts: [`${packagesDir}/**/*.ts`, `${packagesDir}/**/*.cts`, `${packagesDir}/**/*.mts`],
	jsSpec: [`${packagesDir}/**/*.spec.js`, `${packagesDir}/**/*.spec.cjs`, `${packagesDir}/**/*.spec.mjs`],
	tsSpec: [`${packagesDir}/**/*.spec.ts`, `${packagesDir}/**/*.spec.cts`, `${packagesDir}/**/*.spec.mts`],
	ignore: ['**/cjs', '**/es', '**/node_modules', '.idea', 'coverage', '**/*.d.ts'],
};

const memberNames = [
	'^Centrifuge$',
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
	'^be_BY$',
	'^de_DE$',
	'^en_US$',
	'^es_ES$',
	'^es_US$',
	'^et_EE$',
	'^fr_FR$',
	'^he_HE$',
	'^it_IT$',
	'^ka_GE$',
	'^kk_KZ$',
	'^ko_KR$',
	'^lv_LV$',
	'^pl_PL$',
	'^pt_BR$',
	'^ru_RU$',
	'^sv_SE$',
	'^tr_TR$',
	'^uk_UA$',
	'^zh_CN$',
	'^ko_KR$',
];

const namingConvention = [...typescriptStyle.rules['@typescript-eslint/naming-convention']].map(rule => {
	if (typeof rule === 'object') {
		if (rule.selector === 'default' && !rule.modifiers) {
			return {
				...rule,
				filter: {
					match: false,
					regex: [...memberNames].join('|'),
				},
			};
		}

		if (rule.selector === 'memberLike' && !rule.modifiers) {
			return {
				...rule,
				filter: {
					match: false,
					regex: [...memberNames].join('|'),
				},
			};
		}
	}

	return rule;
});

/** @type {import("eslint").Linter.Config[]} */
const config = [
	{
		ignores: [...globs.ignore],
	},
	{
		...node,
		files: [...globs.js, ...globs.ts],
		rules: {
			'unicorn/no-await-expression-member': 'off',
		},
	},
	{
		...nodeStyle,
		files: [...globs.js, ...globs.ts],
	},
	{
		...typescript,
		files: [...globs.ts],
		rules: {
			camelcase: 'off',
			'new-cap': 'off',
			'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
		},
	},
	{
		...typescriptStyle,
		files: [...globs.ts],
		rules: {
			'@typescript-eslint/naming-convention': namingConvention,
		},
	},
	{
		files: ['**/tests/**'],
		rules: {
			'id-length': 'off',
			'no-console': 'off',
		},
	},
];

export default config;
