import type { RateLimiterRequestOptions } from '@d-fischer/rate-limiter';
import type { UserIdResolvable } from '@donation-alerts/common';
import { ReadDocumentation } from '@donation-alerts/common';
import { BaseApi } from '../BaseApi';
import { DonationAlertsApiPaginator } from '../DonationAlertsApiPaginator';
import type { DonationAlertsApiPagination } from '../DonationAlertsApiPagination';
import type { DonationAlertsResponseWithMeta } from '../DonationAlertsResponse';
import type { DonationAlertsDonationData } from './DonationAlertsDonation';
import { DonationAlertsDonation } from './DonationAlertsDonation';

/**
 * Donation Alerts Donations API.
 *
 * Allows fetching donations.
 */
@ReadDocumentation('api')
export class DonationAlertsDonationsApi extends BaseApi {
	/**
	 * Retrieves donations.
	 *
	 * Allows to specify the number of page to return. Otherwise, retrieves the first page.
	 *
	 * @param user The ID of the user to get donations for.
	 * @param pagination Pagination options.
	 * @param rateLimiterOptions The rate limiter options.
	 *
	 * @throws {@link HttpError} if response status code is out of 200-299 range.
	 * @throws {@link UnregisteredUserError} if the user you are trying to get is not registered in authentication provider.
	 * @throws {@link MissingScopeError} if the access token does not have `oauth-donation-index` scope.
	 */
	async getDonations(
		user: UserIdResolvable,
		pagination: DonationAlertsApiPagination = {},
		rateLimiterOptions?: RateLimiterRequestOptions
	): Promise<DonationAlertsDonation[]> {
		const page = typeof pagination.page === 'number' && pagination.page !== 0 ? pagination.page : 1;

		const response = await this._apiClient.callApi<DonationAlertsResponseWithMeta<DonationAlertsDonationData>>(
			user,
			{
				type: 'api',
				url: 'alerts/donations',
				method: 'GET',
				scope: 'oauth-donation-index',
				query: { page },
				auth: true
			},
			rateLimiterOptions
		);

		return response.data.map(donation => new DonationAlertsDonation(donation));
	}

	/**
	 * Retrieves all donations.
	 *
	 * Note: This method can take a long time and return a large amount of data. Consider using
	 * {@link DonationAlertsDonationsApi#createDonationsPaginator} instead to get data partially.
	 *
	 * @param user The ID of the user to get donations for.
	 * @param rateLimiterOptions The rate limiter options.
	 *
	 * @throws {@link HttpError} if response status code is out of 200-299 range.
	 * @throws {@link UnregisteredUserError} if the user you are trying to get is not registered in authentication provider.
	 * @throws {@link MissingScopeError} if the access token does not have `oauth-donation-index` scope.
	 */
	async getAllDonations(
		user: UserIdResolvable,
		rateLimiterOptions?: RateLimiterRequestOptions
	): Promise<DonationAlertsDonation[]> {
		return await this.createDonationsPaginator(user, rateLimiterOptions).getAll();
	}

	/**
	 * Creates the flexible donations API paginator that allows retrieve donations.
	 *
	 * @param user The ID of the user to get donations for.
	 * @param rateLimiterOptions The rate limiter options.
	 */
	createDonationsPaginator(
		user: UserIdResolvable,
		rateLimiterOptions?: RateLimiterRequestOptions
	): DonationAlertsApiPaginator<DonationAlertsDonationData, DonationAlertsDonation> {
		return new DonationAlertsApiPaginator<DonationAlertsDonationData, DonationAlertsDonation>(
			this._apiClient,
			user,
			{
				type: 'api',
				url: 'alerts/donations',
				method: 'GET',
				scope: 'oauth-donation-index',
				auth: true
			},
			donation => new DonationAlertsDonation(donation),
			rateLimiterOptions
		);
	}
}
