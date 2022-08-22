const path = require('path');
const baseStyleRules = require('@stimulcross/eslint-config-typescript/style');

const memberNames = [
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
	'^ko_KR$'
];

const namingConvention = [...baseStyleRules.rules['@typescript-eslint/naming-convention']].map(rule => {
	if (typeof rule === 'object') {
		if (rule.selector === 'default' && !rule.modifiers) {
			return {
				...rule,
				filter: {
					match: false,
					regex: [...memberNames].join('|')
				}
			};
		}
		if (rule.selector === 'memberLike' && !rule.modifiers) {
			return {
				...rule,
				filter: {
					match: false,
					regex: [...memberNames].join('|')
				}
			};
		}
	}

	return rule;
});

module.exports = {
	extends: [
		'@stimulcross/eslint-config-node',
		'@stimulcross/eslint-config-typescript',
		'@stimulcross/eslint-config-typescript/style'
	],
	parserOptions: {
		project: './tsconfig.base.json'
	},
	ignorePatterns: ['./docs', './node_modules'],
	rules: {
		'@typescript-eslint/naming-convention': namingConvention
	},
	settings: {
		'import/resolver': {
			'eslint-import-resolver-lerna': {
				packages: path.resolve(__dirname, 'packages')
			}
		}
	}
};
