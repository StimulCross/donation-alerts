import { type UserIdResolvable } from '@donation-alerts/common';
import { type AccessTokenWithUserId } from '../access-token';

/**
 * Authentication provider that manages access tokens for users.
 *
 * @remarks
 * There are two build-in authentication provider implementations:
 * - {@link StaticAuthProvider} - Accepts a user with the access token, but cannot refresh it.
 * - {@link RefreshingAuthProvider} - Automatically refreshes access tokens on expiration whether necessary.
 *
 * If these implementations do not meet your needs, you can create your own provider, for example, a Redis-based one,
 * that can share auth data between separate processes.
 */
export interface AuthProvider {
	/**
	 * The client ID.
	 */
	readonly clientId: string;

	/**
	 * Gets the scopes for a user that are currently available using the access token.
	 *
	 * If scopes were not set on user registration then it returns an empty array.
	 *
	 * @throws {@link UnregisteredUserError} if user is not registered in the provider.
	 */
	getScopesForUser(user: UserIdResolvable): string[];

	/**
	 * Gets the access token data for the given user.
	 *
	 * @param user The ID of the user to get the access token of.
	 * @param scopes The list of required scopes that will be compared against the existing token scopes.
	 *
	 * @throws {@link UnregisteredUserError} if user is not registered in the provider.
	 * @throws {@link MissingScopeError} if user is not registered in the provider.
	 */
	getAccessTokenForUser(user: UserIdResolvable, scopes?: string[]): Promise<AccessTokenWithUserId>;

	/**
	 * Refreshes the access token.
	 *
	 * This method is optional to implement.
	 *
	 * @param user The ID of the user to refresh the access token of.
	 */
	refreshAccessTokenForUser?(user: UserIdResolvable): Promise<AccessTokenWithUserId>;
}
