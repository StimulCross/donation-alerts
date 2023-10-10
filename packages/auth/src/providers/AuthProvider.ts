import { type UserIdResolvable } from '@donation-alerts/common';
import { type AccessToken } from '../AccessToken';

/**
 * Authentication provider that manages access tokens for users.
 *
 * @remarks
 * There are two ways to use authentication provider:
 * - {@link StaticAuthProvider} - Accepts a user with the access token, but cannot refresh it.
 * - {@link RefreshingAuthProvider} - Automatically refreshes access tokens on expiration whether necessary.
 */
export interface AuthProvider {
	/**
	 * The client ID.
	 */
	clientId: string;

	/**
	 * Gets the scopes for a user that are currently available using the access token.
	 *
	 * If scopes were not set on user registration then it returns an empty array.
	 *
	 * @throws {@link UnregisteredUserError} if user is not registered in the provider.
	 */
	getScopesForUser: (user: UserIdResolvable) => string[];

	/**
	 * Gets the access token data for the given user.
	 *
	 * @param userId The ID of the user to get the access token of.
	 * @param scopes The list of required scopes that will be compared against the existing token scopes.
	 *
	 * @throws {@link UnregisteredUserError} if user is not registered in the provider.
	 * @throws {@link MissingScopeError} if user is not registered in the provider.
	 */
	getAccessTokenForUser: (user: UserIdResolvable, scopes?: string[]) => Promise<AccessToken>;

	/**
	 * Force refresh of the access token.
	 *
	 * @param userId The ID of the user to refresh the access token of.
	 */
	refreshAccessTokenForUser?: (user: UserIdResolvable) => Promise<AccessToken>;
}
