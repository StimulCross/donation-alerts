const transformPattern = '^.+\\.ts?$';
const transform = {
	[transformPattern]: ['ts-jest', { diagnostics: { ignoreCodes: ['TS151001'] }, tsconfig: './tsconfig.json' }],
};

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
	preset: 'ts-jest',
	moduleFileExtensions: ['ts', 'js', 'node', 'json'],
	rootDir: './',
	testEnvironment: 'node',
	globals: {
		'ts-jest': {
			tsconfig: {
				experimentalDecorators: true,
				useDefineForClassFields: false,
			},
		},
	},
	transform,
	coverageDirectory: '<rootDir>/coverage',
	moduleDirectories: ['node_modules'],
	projects: [
		{
			displayName: 'common',
			testMatch: ['<rootDir>/packages/common/**/*.spec.ts'],
			transform,
			collectCoverageFrom: ['<rootDir>/packages/common/src/**/*.ts', '!<rootDir>/packages/common/src/index.ts'],
		},
		{
			displayName: 'api-call',
			testMatch: ['<rootDir>/packages/api-call/**/*.spec.ts'],
			transform,
			collectCoverageFrom: [
				'<rootDir>/packages/api-call/src/**/*.ts',
				'!<rootDir>/packages/api-call/src/index.ts',
			],
		},
		{
			displayName: 'auth',
			testMatch: ['<rootDir>/packages/auth/**/*.spec.ts'],
			transform,
			collectCoverageFrom: ['<rootDir>/packages/auth/src/**/*.ts', '!<rootDir>/packages/auth/src/index.ts'],
		},
	],
};
