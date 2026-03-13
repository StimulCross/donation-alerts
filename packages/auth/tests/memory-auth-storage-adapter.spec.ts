import { promiseWithResolvers } from '@donation-alerts/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type AccessToken } from '../src/index.js';
import { MemoryAuthStorageAdapter } from '../src/storages/memory-auth-storage.adapter.js';

function createToken(value: string): AccessToken {
	return {
		accessToken: value,
		refreshToken: `R-${value}`,
		expiresIn: 3600,
		obtainmentTimestamp: Date.now(),
		scopes: ['scope'],
	};
}

describe('MemoryAuthStorageAdapter', () => {
	let storage: MemoryAuthStorageAdapter;

	beforeEach(() => {
		vi.useFakeTimers();
		storage = new MemoryAuthStorageAdapter();
	});

	afterEach(async () => {
		await storage.destroy();
		vi.useRealTimers();
	});

	describe('Basic Operations', () => {
		it('should return null when token does not exist', async () => {
			const result = await storage.get(1);
			expect(result).toBeNull();
		});

		it('should store and retrieve token', async () => {
			const token = createToken('A');
			await storage.set(1, token);
			const result = await storage.get(1);

			expect(result).toEqual(token);
		});

		it('should delete stored token', async () => {
			await storage.set(1, createToken('A'));
			const isDeleted = await storage.delete(1);
			const result = await storage.get(1);

			expect(isDeleted).toBe(true);
			expect(result).toBeNull();
		});
	});

	describe('Expiration and TTL', () => {
		it('should return null and remove token if accessed after TTL expires', async () => {
			await storage.set(1, createToken('A'), 5000);

			vi.advanceTimersByTime(5001);

			const result = await storage.get(1);
			expect(result).toBeNull();
		});

		it('should return false and remove token if ttlMs is 0 or negative', async () => {
			await storage.set(1, createToken('A'));
			const isTokenStored = await storage.set(1, createToken('B'), 0);

			expect(isTokenStored).toBe(false);
			expect(await storage.get(1)).toBeNull();
		});

		it('should clean up expired tokens via background interval', async () => {
			await storage.set(1, createToken('A'), 1000);
			await storage.set(2, createToken('B'), 70_000);

			vi.advanceTimersByTime(2000);
			vi.advanceTimersByTime(60_000);

			expect(await storage.get(1)).toBeNull();
			expect(await storage.get(2)).not.toBeNull();
		});
	});

	describe('Locking Mechanism', () => {
		it('should allow acquiring and releasing a lock', async () => {
			await expect(storage.acquireLock(1)).resolves.toBeUndefined();
			await expect(storage.releaseLock(1)).resolves.toBeUndefined();
		});

		it('should block subsequent lock acquisitions until released', async () => {
			const order: number[] = [];
			const { resolve: resolveP1 } = promiseWithResolvers();

			await storage.acquireLock(1);

			const p2 = storage.acquireLock(1).then(() => {
				order.push(2);
			});

			order.push(1);
			resolveP1();

			await storage.releaseLock(1);
			await p2;

			expect(order).toEqual([1, 2]);
		});

		it('should isolate locks by user id', async () => {
			let isUser2Locked = false;

			await storage.acquireLock(1);

			const p2 = storage.acquireLock(2).then(() => {
				isUser2Locked = true;
			});

			await p2;
			expect(isUser2Locked).toBe(true);
		});
	});

	describe('Teardown and Error Handling', () => {
		it('should reject waiting locks when cleared', async () => {
			await storage.acquireLock(1);

			const waitingLock = storage.acquireLock(1);

			await storage.clear();

			await expect(waitingLock).rejects.toThrow(/Store was cleared/gu);
		});
	});
});
