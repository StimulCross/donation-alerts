import { ReadDocumentation, type UserIdResolvable } from '@donation-alerts/common';
import { DonationAlertsUser, type DonationAlertsUserData } from './donation-alerts-user.js';
import { type DonationAlertsApiRequestOptions } from '../../interfaces/donation-alerts-api-request-options.js';
import { type DonationAlertsResponseSingleData } from '../../interfaces/donation-alerts-response-data.js';
import { BaseApi } from '../base-api.js';

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
	 * @param requestOptions Additional request options, such as fetch options and rate limiting,
	 * that can be used to control the request rate.
	 *
	 * @returns A {@link DonationAlertsUser} instance containing the user's profile information.
	 *
	 * @throws {@link HttpError} if the response status code falls outside the 200–299 range.
	 * @throws {@link UnregisteredUserError} if the specified user is not registered in the authentication provider.
	 * @throws {@link MissingScopeError} if the provided access token is missing the required `oauth-user-show` scope.
	 * @throws {@link RateLimitError} If the Donation Alerts API rate limit is exceeded.
	 *
	 * @example
	 * ```ts
	 * const user = await apiClient.users.getUser(userId);
	 * console.log(`User ID: ${user.id}, Name: ${user.name}`);
	 * ```
	 */
	public async getUser(
		user: UserIdResolvable,
		requestOptions?: DonationAlertsApiRequestOptions,
	): Promise<DonationAlertsUser> {
		const response = await this._apiClient.callApi<DonationAlertsResponseSingleData<DonationAlertsUserData>>(
			user,
			{
				type: 'api',
				url: 'user/oauth',
				method: 'GET',
				scope: 'oauth-user-show',
				auth: true,
			},
			requestOptions,
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
	 * @param requestOptions Additional request options, such as fetch options and rate limiting,
	 * that can be used to control the request rate.
	 *
	 * @returns A string containing the user's socket connection token.
	 *
	 * @throws {@link HttpError} if the response status code falls outside the 200–299 range.
	 * @throws {@link UnregisteredUserError} if the specified user is not registered in the authentication provider.
	 * @throws {@link MissingScopeError} if the provided access token is missing the required `oauth-user-show` scope.
	 * @throws {@link RateLimitError} If the Donation Alerts API rate limit is exceeded.
	 *
	 * @example
	 * ```ts
	 * const token = await apiClient.users.getSocketConnectionToken(authenticatedUserId);
	 * console.log(`Socket connection token: ${token}`);
	 * ```
	 */
	public async getSocketConnectionToken(
		user: UserIdResolvable,
		requestOptions?: DonationAlertsApiRequestOptions,
	): Promise<string> {
		const userData = await this.getUser(user, requestOptions);
		return userData.socketConnectionToken;
	}
}
