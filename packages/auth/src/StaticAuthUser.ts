import type { Optional } from '@stimulcross/shared-utils';
import type { UserIdResolvable } from '@donation-alerts/common';
import type { AccessToken } from './AccessToken';

/**
 * The user data to register in the auth provider.
 */
export interface StaticAuthUser {
	/**
	 * The ID of the authenticated user.
	 */
	user: UserIdResolvable;

	/**
	 * The access token of the authenticated user.
	 */
	accessToken: Optional<AccessToken, 'refreshToken' | 'expiresIn' | 'obtainmentTimestamp'>;
}
