import { type UserIdResolvable } from '@donation-alerts/common';
import { type AccessToken } from './AccessToken';

/**
 * The user data to register in the auth provider.
 */
export interface AuthUser {
	/**
	 * The ID of the authenticated user.
	 */
	user: UserIdResolvable;

	/**
	 * The access token of the authenticated user.
	 */
	accessToken: AccessToken;
}
