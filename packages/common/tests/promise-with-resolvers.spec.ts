import { describe, it, expect } from 'vitest';
import { promiseWithResolvers } from '../src/utils/promise-with-resolvers.js';

describe('promiseWithResolvers', () => {
	it('should return an object with promise, resolve and reject', () => {
		const r = promiseWithResolvers<number>();

		expect(r).toBeTruthy();
		expect(r.promise).toBeInstanceOf(Promise);
		expect(typeof r.resolve).toBe('function');
		expect(typeof r.reject).toBe('function');
	});

	it('should resolve the promise with a value', async () => {
		const r = promiseWithResolvers<number>();

		r.resolve(42);

		await expect(r.promise).resolves.toBe(42);
	});

	it('should resolve the promise with a PromiseLike value', async () => {
		const r = promiseWithResolvers<number>();

		r.resolve(Promise.resolve(7));

		await expect(r.promise).resolves.toBe(7);
	});

	it('should reject the promise with a reason', async () => {
		const r = promiseWithResolvers<number>();
		const err = new Error('boom');

		r.reject(err);

		await expect(r.promise).rejects.toBe(err);
	});

	it('should settle only once (resolve then reject)', async () => {
		const r = promiseWithResolvers<number>();

		r.resolve(1);
		r.reject(new Error('should be ignored'));

		await expect(r.promise).resolves.toBe(1);
	});

	it('should settle only once (reject then resolve)', async () => {
		const r = promiseWithResolvers<number>();
		const err = new Error('first');

		r.reject(err);
		r.resolve(123);

		await expect(r.promise).rejects.toBe(err);
	});
});
