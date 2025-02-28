import { type RateLimiterRequestOptions } from '@d-fischer/rate-limiter';
import { ReadDocumentation, type UserIdResolvable } from '@donation-alerts/common';
import { DonationAlertsUser, type DonationAlertsUserData } from './donation-alerts-user';
import { BaseApi } from '../base-api';
import { type DonationAlertsResponseSingleData } from '../donation-alerts-response';

/**
 * Donation Alerts Users API.
 *
 * @remarks
 * Provides methods to interact with Donation Alerts users, including retrieving user profiles
 * and socket connection tokens.
 */
@ReadDocumentation('api')
export class DonationAlertsUsersApi extends BaseApi {
	/**
	 * Fetches the authenticated user's information based on the provided user ID.
	 *
	 * @remarks
	 * Requires `oauth-user-show` scope.
	 *
	 * @param user The ID of the user whose profile needs to be fetched.
	 * @param rateLimiterOptions Optional rate limiter configuration to control API requests.
	 *
	 * @returns A {@link DonationAlertsUser} instance containing the user's profile information.
	 *
	 * @throws {@link HttpError} if the response status code falls outside the 200–299 range.
	 * @throws {@link UnregisteredUserError} if the specified user is not registered in the authentication provider.
	 * @throws {@link MissingScopeError} if the provided access token is missing the required `oauth-user-show` scope.
	 *
	 * @example
	 * ```ts
	 * const user = await apiClient.users.getUser(userId);
	 * console.log(`User ID: ${user.id}, Name: ${user.name}`);
	 * ```
	 */
	async getUser(user: UserIdResolvable, rateLimiterOptions?: RateLimiterRequestOptions): Promise<DonationAlertsUser> {
		const response = await this._apiClient.callApi<DonationAlertsResponseSingleData<DonationAlertsUserData>>(
			user,
			{
				type: 'api',
				url: 'user/oauth',
				method: 'GET',
				scope: 'oauth-user-show',
				auth: true,
			},
			rateLimiterOptions,
		);

		return new DonationAlertsUser(response.data);
	}

	/**
	 * Fetches a Centrifugo connection token required for establishing real-time socket connections for the
	 * specified user.
	 *
	 * @remarks
	 * This method internally uses {@link getUser} method to fetch the profile of the user, then extracts
	 * the `socketConnectionToken` property.
	 *
	 * @param user The ID of the user for whom the token is being fetched.
	 * @param rateLimiterOptions Optional rate limiter configuration to control API requests.
	 *
	 * @returns A string containing the user's socket connection token.
	 *
	 * @throws {@link HttpError} if the response status code falls outside the 200–299 range.
	 * @throws {@link UnregisteredUserError} if the specified user is not registered in the authentication provider.
	 * @throws {@link MissingScopeError} if the provided access token is missing the required `oauth-user-show` scope.
	 *
	 * @example
	 * ```ts
	 * const token = await apiClient.users.getSocketConnectionToken(authenticatedUserId);
	 * console.log(`Socket connection token: ${token}`);
	 * ```
	 */
	async getSocketConnectionToken(
		user: UserIdResolvable,
		rateLimiterOptions?: RateLimiterRequestOptions,
	): Promise<string> {
		return (await this.getUser(user, rateLimiterOptions)).socketConnectionToken;
	}
}
