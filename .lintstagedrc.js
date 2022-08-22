module.exports = {
	'*.{js,ts,css,json,md}': 'prettier --config ".prettierrc.js" --write ',
	'*.{js,ts}': 'eslint -c ./.eslintrc.js --ignore-pattern ./.eslintrc.js'
};
