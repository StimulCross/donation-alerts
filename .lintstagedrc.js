module.exports = {
	'*.{js,ts,css,json,md}': 'prettier --config ".prettierrc.js" --write ',
	'packages/*.{js,ts}': 'eslint'
};
