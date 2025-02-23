module.exports = {
	'*.{js,ts,css,json,md}': 'prettier --config ".prettierrc.js" --write ',
	'packages/**/src/*.{js,ts}': 'eslint .'
};
