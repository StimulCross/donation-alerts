/**
 * @typedef {object} NamingConventionRule
 * @property {string|string[]} selector
 * @property {string[]} [modifiers]
 * @property {string[]} [format]
 * @property {{ match: boolean, regex: string }} [filter]
 */

/**
 * @typedef {string | NamingConventionRule} Rule
 */

/**
 * @param {NamingConventionRule} rule
 * @param {Partial<NamingConventionRule>} match
 */
export function matchRule(rule, match) {
	return Object.entries(match).every(([key, value]) => rule[key] === value);
}

/**
 * @param {Iterable<string>} names
 */
export function createExcludeFilter(names) {
	return {
		match: false,
		regex: [...names].join('|'),
	};
}

/**
 * @param {NamingConventionRule} rule
 * @param {Iterable<string>} names
 */
export function extendFilter(rule, names) {
	return {
		match: false,
		regex: [rule.filter?.regex, ...names].filter(Boolean).join('|'),
	};
}

/**
 * @param {readonly Rule[]} base
 * @param {Array<{
 *   when: (rule: NamingConventionRule) => boolean
 *   apply: (rule: NamingConventionRule) => NamingConventionRule
 * }>} overrides
 * @returns {Rule[]}
 */
export function extendNamingConvention(base, overrides) {
	return base.map(rule => {
		if (typeof rule !== 'object') {
			return rule;
		}

		for (const { when, apply } of overrides) {
			if (when(rule)) {
				return apply(rule);
			}
		}

		return rule;
	});
}
