import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'node',
		globals: false,
		projects: ['packages/*'],
		include: ['packages/**/**/*.spec.ts'],
		coverage: {
			provider: 'v8',
			reportsDirectory: './coverage',
			include: ['packages/**/src/**/*.ts'],
			exclude: ['**/src/index.ts'],
		},
	},
});
