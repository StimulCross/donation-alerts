import { promiseWithResolvers } from '@donation-alerts/common';
import { Deque } from '@stimulcross/ds-deque';
import { type AccessToken } from '../interfaces/access-token.js';
import { type AuthStorage } from '../interfaces/auth-storage.js';

interface TokenEntry {
	token: AccessToken;
	expiresAt?: number;
}

interface Waiter {
	resolve: () => void;
	reject: (err: Error) => void;
}

const CLEANUP_INTERVAL_MS = 60_000;

/** @internal */
export class MemoryAuthStorageAdapter implements AuthStorage {
	private readonly _registry = new Map<number, TokenEntry>();
	private readonly _activeLocks = new Set<number>();
	private readonly _waitingResolvers = new Map<number, Deque<Waiter>>();

	private readonly _cleanupTimer: ReturnType<typeof setInterval>;

	constructor() {
		this._cleanupTimer = setInterval(() => {
			const now = Date.now();

			for (const [key, entry] of this._registry.entries()) {
				if (entry.expiresAt && entry.expiresAt <= now) {
					this._registry.delete(key);
				}
			}
		}, CLEANUP_INTERVAL_MS);

		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		if (this._cleanupTimer.unref) {
			this._cleanupTimer.unref();
		}
	}

	public async get(userId: number): Promise<AccessToken | null> {
		const entry = this._registry.get(userId);

		if (entry?.expiresAt && entry.expiresAt <= Date.now()) {
			this._registry.delete(userId);
			return null;
		}

		return entry?.token ?? null;
	}

	public async set(userId: number, token: AccessToken, ttlMs?: number): Promise<boolean> {
		const entry: TokenEntry = { token };

		if (typeof ttlMs === 'number') {
			if (ttlMs <= 0) {
				this._registry.delete(userId);
				return false;
			}

			entry.expiresAt = Date.now() + ttlMs;
		}

		this._registry.set(userId, entry);

		return true;
	}

	public async delete(userId: number): Promise<boolean> {
		return this._registry.delete(userId);
	}

	public async clear(): Promise<void> {
		this._registry.clear();

		const error = new Error('Store was cleared while waiting for lock');

		for (const queue of this._waitingResolvers.values()) {
			while (queue.size > 0) {
				const waiter = queue.shift();

				if (waiter) {
					waiter.reject(error);
				}
			}
		}

		this._waitingResolvers.clear();
		this._activeLocks.clear();
	}

	public async destroy(): Promise<void> {
		clearInterval(this._cleanupTimer);
		await this.clear();
	}

	public async acquireLock(userId: number): Promise<void> {
		if (this._activeLocks.has(userId)) {
			const { promise, resolve, reject } = promiseWithResolvers();

			const queue = this._waitingResolvers.get(userId) ?? new Deque();
			queue.push({ resolve, reject });
			this._waitingResolvers.set(userId, queue);

			await promise;
		} else {
			this._activeLocks.add(userId);
		}
	}

	public async releaseLock(userId: number): Promise<void> {
		const queue = this._waitingResolvers.get(userId);

		if (queue && queue.size > 0) {
			const nextWaiter = queue.shift();

			if (nextWaiter) {
				nextWaiter.resolve();
			}

			if (queue.size === 0) {
				this._waitingResolvers.delete(userId);
			}
		} else {
			this._activeLocks.delete(userId);
			this._waitingResolvers.delete(userId);
		}
	}
}
