import { type UserIdResolvable } from '@donation-alerts/common';
import { type AccessTokenWithUserId } from '../access-token';

/**
 * Authentication provider that manages user access tokens.
 *
 * @remarks
 * This interface can be implemented in various ways. Two built-in implementations are provided:
 * - {@link StaticAuthProvider} - Accepts a user and an access token, but does not support refreshing.
 * - {@link RefreshingAuthProvider} - Automatically refreshes access tokens upon expiration.
 *
 * If these implementations are not sufficient for your use case, you can create a custom one.
 * For example, you could store and manage authentication data in Redis to share it between
 * multiple processes or containers.
 */
export interface AuthProvider {
	/**
	 * The client ID.
	 */
	readonly clientId: string;

	/**
	 * Retrieves the scopes currently associated with the specified user's access token.
	 *
	 * Returns an empty array if no scopes were set during user registration.
	 *
	 * @param user The ID of a user whose scopes should be retrieved.
	 *
	 * @throws {@link UnregisteredUserError} - Thrown if the user is not registered with this provider.
	 */
	getScopesForUser(user: UserIdResolvable): string[];

	/**
	 * Gets the access token data for the specified user.
	 *
	 * @param user The ID of a user whose token is being requested.
	 * @param scopes An optional list of required scopes to validate against the token's current scopes.
	 *
	 * @throws {@link UnregisteredUserError} if the user is not registered with this provider.
	 * @throws {@link MissingScopeError} if the token does not include the required scopes.
	 */
	getAccessTokenForUser(user: UserIdResolvable, scopes?: string[]): Promise<AccessTokenWithUserId>;

	/**
	 * Refreshes the user's access token.
	 *
	 * @remarks
	 * This method is optional and may not be implemented by all authentication providers.
	 *
	 * @param user The ID of a user whose token should be refreshed.
	 */
	refreshAccessTokenForUser?(user: UserIdResolvable): Promise<AccessTokenWithUserId>;
}
