import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
	test: {
		root: rootDir,
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
