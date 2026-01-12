import { AuthStorage } from './auth-storage.js';
import { AccessToken } from '../access-token.js';

/** @internal */
export class MemoryAuthStorageAdapter implements AuthStorage {
	private readonly _registry = new Map<number, AccessToken>();
	private readonly _queues = new Map<number, Promise<unknown>>();

	async get(userId: number): Promise<AccessToken | null> {
		return this._enqueue<AccessToken | null>(userId, () => this._registry.get(userId) ?? null);
	}

	async set(userId: number, token: AccessToken): Promise<boolean> {
		return this._enqueue<boolean>(userId, () => {
			this._registry.set(userId, token);
			return true;
		});
	}

	async delete(userId: number): Promise<boolean> {
		return this._enqueue<boolean>(userId, () => this._registry.delete(userId));
	}

	private _enqueue<T>(userId: number, fn: () => T | Promise<T>): Promise<T> {
		const previous = this._queues.get(userId) ?? Promise.resolve();

		const task = async () => {
			try {
				return await fn();
			} catch (e) {
				throw e;
			}
		};

		const next = previous.catch(() => {}).then(task);

		this._queues.set(
			userId,
			next.finally(() => {
				if (this._queues.get(userId) === next) {
					this._queues.delete(userId);
				}
			}),
		);

		return next;
	}
}
