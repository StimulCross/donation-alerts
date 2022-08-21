import type { RateLimiterRequestOptions } from '@d-fischer/rate-limiter';
import type { UserIdResolvable } from '@donation-alerts/common';
import { ReadDocumentation } from '@donation-alerts/common';
import { BaseApi } from '../BaseApi';
import type { DonationAlertsResponseSingleData } from '../DonationAlertsResponse';
import type { DonationAlertsUserData } from './DonationAlertsUser';
import { DonationAlertsUser } from './DonationAlertsUser';

/**
 * Donation Alerts Users API.
 *
 * Allows fetching the authorized user.
 */
@ReadDocumentation('api')
export class DonationAlertsUsersApi extends BaseApi {
	/**
	 * Retrieves user profile information.
	 *
	 * Requires the `oauth-user-show` scope.
	 *
	 * @param user The ID of the user to get profile for.
	 * @param rateLimiterOptions The rate limiter options.
	 *
	 * @throws {@link HttpError} if response status code is out of 200-299 range.
	 * @throws {@link UnregisteredUserError} if the user you are trying to get is not registered in authentication provider.
	 * @throws {@link MissingScopeError} if the access token does not have `oauth-user-show` scope.
	 */
	async getUser(user: UserIdResolvable, rateLimiterOptions?: RateLimiterRequestOptions): Promise<DonationAlertsUser> {
		const response = await this._apiClient.callApi<DonationAlertsResponseSingleData<DonationAlertsUserData>>(
			user,
			{
				type: 'api',
				url: 'user/oauth',
				method: 'GET',
				scope: 'oauth-user-show',
				auth: true
			},
			rateLimiterOptions
		);

		return new DonationAlertsUser(response.data);
	}

	/**
	 * Retrieves socket connection token related to the authorized user.
	 *
	 * Requires user authorization with the `oauth-user-show` scope.
	 *
	 * @param user The ID of the user to get profile for.
	 * @param rateLimiterOptions The rate limiter options.
	 *
	 * @throws {@link HttpError} if response status code is out of 200-299 range.
	 * @throws {@link UnregisteredUserError} if the user you are trying to get is not registered in authentication provider.
	 * @throws {@link MissingScopeError} if the access token does not have `oauth-user-show` scope.
	 */
	async getSocketConnectionToken(
		user: UserIdResolvable,
		rateLimiterOptions?: RateLimiterRequestOptions
	): Promise<string> {
		return (await this.getUser(user, rateLimiterOptions)).socketConnectionToken;
	}
}
