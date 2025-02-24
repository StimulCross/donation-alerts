import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'node',
		watch: false,
		workspace: ['packages/*'],
		include: ['**/*.spec.ts'],
		coverage: {
			reporter: ['text', 'json', 'html'],
			reportsDirectory: 'coverage',
			include: ['packages/**/src/**/*.ts'],
			exclude: ['**/index.ts'],
		},
	},
});
