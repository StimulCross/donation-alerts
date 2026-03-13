import { type AccessToken } from './access-token.js';

/**
 * An abstraction over a storage mechanism for access tokens.
 *
 * This storage is used by the {@link RefreshingAuthProvider} to store access tokens.
 */
export interface AuthStorage {
	/**
	 * Retrieves an access token for the given user ID.
	 *
	 * @param userId The ID of the user for which to retrieve the token.
	 *
	 * @returns The retrieved token, or `null` if no token was found.
	 */
	get(userId: number): Promise<AccessToken | null>;

	/**
	 * Sets an access token for the given user ID.
	 *
	 * @param userId The ID of the user for which to set the token.
	 * @param token The token data to set.
	 * @param ttlMs The time-to-live for the token, in milliseconds.
	 *
	 * @returns `true` if the operation was successful, `false` otherwise.
	 */
	set(userId: number, token: AccessToken, ttlMs?: number): Promise<boolean>;

	/**
	 * Deletes an access token for the given user ID.
	 *
	 * @param userId The ID of the user for which to delete the token.
	 *
	 * @returns `true` if the operation was successful, `false` otherwise.
	 */
	delete(userId: number): Promise<boolean>;

	/**
	 * Clears all stored access tokens.
	 */
	clear(): Promise<void>;

	/**
	 * Destroys the storage.
	 *
	 * @remarks
	 * This method cleans resources for graceful shutdown. It should not be used for any other purpose.
	 */
	destroy?(): Promise<void>;

	/**
	 * Acquires a lock to prevent concurrent access to the storage.
	 */
	acquireLock?(userId: number): Promise<void>;

	/**
	 * Releases the lock acquired by {@link acquireLock}.
	 */
	releaseLock?(userId: number): Promise<void>;
}
