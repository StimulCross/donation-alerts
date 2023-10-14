const transformPattern = '^.+\\.ts?$';
const transform = {
	[transformPattern]: ['ts-jest', { diagnostics: { ignoreCodes: ['TS151001'] }, tsconfig: './tsconfig.json' }]
};

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
	preset: 'ts-jest',
	moduleFileExtensions: ['ts', 'js', 'node', 'json'],
	rootDir: './',
	testEnvironment: 'node',
	transform,
	testMatch: ['<rootDir>/tests/**/*.spec.ts'],
	coverageDirectory: '<rootDir>/coverage',
	// collectCoverageFrom: ['<rootDir>/packages/*/src/**/*.ts', '!<rootDir>/packages/**/src/index.ts'],
	moduleDirectories: ['node_modules'],
	projects: [
		{
			displayName: 'auth',
			testMatch: ['<rootDir>/tests/auth/*.spec.ts'],
			transform,
			collectCoverageFrom: ['<rootDir>/packages/auth/src/**/*.ts', '!<rootDir>/packages/auth/src/index.ts']
		}
	]
};
