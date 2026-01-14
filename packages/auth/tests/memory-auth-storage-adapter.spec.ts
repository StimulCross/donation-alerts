import { describe, it, expect } from 'vitest';
import { type AccessToken } from '../src/index.js';
import { MemoryAuthStorageAdapter } from '../src/storages/memory-auth-storage.adapter.js';

function token(value: string): AccessToken {
	return {
		accessToken: value,
		refreshToken: `R-${value}`,
		expiresIn: 3600,
		obtainmentTimestamp: Date.now(),
		scopes: ['scope'],
	};
}

describe('MemoryAuthStorageAdapter', () => {
	it('should return null when token does not exist', async () => {
		const storage = new MemoryAuthStorageAdapter();

		const result = await storage.get(1);

		expect(result).toBeNull();
	});

	it('should store and retrieve token', async () => {
		const storage = new MemoryAuthStorageAdapter();
		const t = token('A');

		await storage.set(1, t);
		const result = await storage.get(1);

		expect(result).toEqual(t);
	});

	it('should delete stored token', async () => {
		const storage = new MemoryAuthStorageAdapter();
		const t = token('A');

		await storage.set(1, t);
		const isDeleted = await storage.delete(1);
		const result = await storage.get(1);

		expect(isDeleted).toBe(true);
		expect(result).toBeNull();
	});

	it('should execute operations for the same user strictly in FIFO order', async () => {
		const storage = new MemoryAuthStorageAdapter();
		const order: string[] = [];

		const p1 = storage.set(1, token('A')).then(() => order.push('A'));
		const p2 = storage.set(1, token('B')).then(() => order.push('B'));
		const p3 = storage.set(1, token('C')).then(() => order.push('C'));

		await Promise.all([p1, p2, p3]);

		const result = await storage.get(1);

		expect(order).toEqual(['A', 'B', 'C']);
		expect(result?.accessToken).toBe('C');
	});

	it('should ensure sequential state visibility for the same user', async () => {
		const storage = new MemoryAuthStorageAdapter();

		await storage.set(1, token('A'));

		const p1 = storage.get(1);
		const p2 = storage.set(1, token('B'));
		const p3 = storage.get(1);

		const [first, , second] = await Promise.all([p1, p2, p3]);

		expect(first?.accessToken).toBe('A');
		expect(second?.accessToken).toBe('B');
	});

	it('should isolate queues per user', async () => {
		const storage = new MemoryAuthStorageAdapter();

		await Promise.all([
			storage.set(1, token('A1')),
			storage.set(2, token('B1')),
			storage.set(1, token('A2')),
			storage.set(2, token('B2')),
		]);

		const t1 = await storage.get(1);
		const t2 = await storage.get(2);

		expect(t1?.accessToken).toBe('A2');
		expect(t2?.accessToken).toBe('B2');
	});

	it('should continue processing queue after a failed operation', async () => {
		const storage = new MemoryAuthStorageAdapter();

		// eslint-disable-next-line unicorn/consistent-function-scoping
		const failing = async (): Promise<never> => {
			throw new Error('fail');
		};

		// @ts-ignore private access
		await expect(storage._enqueue(1, failing)).rejects.toThrow();

		await storage.set(1, token('A'));
		const result = await storage.get(1);

		expect(result?.accessToken).toBe('A');
	});
});
