import { ReadDocumentation, type UserIdResolvable } from '@donation-alerts/common';
import { DonationAlertsDonation, type DonationAlertsDonationData } from './donation-alerts-donation.js';
import { type DonationAlertsApiPagination } from '../../interfaces/donation-alerts-api-pagination.js';
import { type DonationAlertsApiRequestOptions } from '../../interfaces/donation-alerts-api-request-options.js';
import { type DonationAlertsPaginatedResult } from '../../interfaces/donation-alerts-paginated-result.js';
import { type DonationAlertsResponseWithMeta } from '../../interfaces/donation-alerts-response-data.js';
import { BaseApi } from '../base-api.js';
import { DonationAlertsApiPaginator } from '../donation-alerts-api-paginator.js';

/**
 * Donation Alerts Donations API.
 *
 * @remarks
 * This API provides functionality to fetch donations associated with a streamer’s account.
 * It supports fetching donations page-by-page, retrieving all donations, and working with paginators
 * for more flexible data handling.
 *
 * The API methods require the `oauth-donation-index` scope to access the data.
 */
@ReadDocumentation('api')
export class DonationAlertsDonationsApi extends BaseApi {
	/**
	 * Fetches a single page of donation data for a specified user.
	 *
	 * @remarks
	 * Requires the `oauth-donation-index` scope.
	 *
	 * If no pagination options are provided, it defaults to the first page.
	 *
	 * @param user The ID of the user to fetch donations for.
	 * @param pagination Pagination options (e.g., page number to retrieve).
	 * @param requestOptions Additional request options, such as fetch options and rate limiting,
	 * that can be used to control the request rate.
	 *
	 * @returns A promise that resolves to an array of {@link DonationAlertsDonation} objects.
	 *
	 * @throws {@link HttpError} if the HTTP status code is outside the range of 200–299.
	 * @throws {@link UnregisteredUserError} if the user is not registered in the authentication provider.
	 * @throws {@link MissingScopeError} if the access token lacks the `oauth-donation-index` scope.
	 * @throws {@link RateLimitError} If the Donation Alerts API rate limit is exceeded.
	 *
	 * @example
	 * ```typescript
	 * const donations = await apiClient.donations.getDonations(userId, { page: 1 });
	 * donations.forEach(donation => console.log(donation.username, donation.amount, donation.currency));
	 * ```
	 */
	public async getDonations(
		user: UserIdResolvable,
		pagination: DonationAlertsApiPagination = {},
		requestOptions?: DonationAlertsApiRequestOptions,
	): Promise<DonationAlertsPaginatedResult<DonationAlertsDonation>> {
		const page = typeof pagination.page === 'number' && pagination.page !== 0 ? pagination.page : 1;

		const response = await this._apiClient.callApi<DonationAlertsResponseWithMeta<DonationAlertsDonationData>>(
			user,
			{
				type: 'api',
				url: 'alerts/donations',
				method: 'GET',
				scope: 'oauth-donation-index',
				query: { page },
				auth: true,
			},
			requestOptions,
		);

		return {
			data: response.data.map(donation => new DonationAlertsDonation(donation)),
			pagination: {
				currentPage: response.meta.current_page,
				lastPage: response.meta.last_page,
				perPage: response.meta.per_page,
				from: response.meta.from,
				to: response.meta.to,
				total: response.meta.total,
			},
		};
	}

	/**
	 * @deprecated
	 * Use {@link createDonationsPaginator} instead.
	 *
	 * Fetching all donations at once is generally a bad idea.
	 * Prefer using a paginator to request pages sequentially
	 * and process them as they are received.
	 *
	 * If you absolutely must retrieve all donations in a single request,
	 * use {@link DonationAlertsApiPaginator#getAll}.
	 *
	 *
	 * Fetches **all** donations associated with the specified user.
	 *
	 * @remarks
	 * Requires the `oauth-donation-index` scope.
	 *
	 * This method retrieves all donation data for a user and may take longer to execute, especially
	 * for users with a large volume of donations. For better performance with large datasets, consider
	 * using the {@link DonationAlertsDonationsApi#createDonationsPaginator} method to fetch data in chunks.
	 *
	 * @param user The ID of the user to fetch all donations for.
	 * @param requestOptions Additional request options, such as fetch options and rate limiting,
	 * that can be used to control the request rate.
	 *
	 * @returns A promise that resolves to an array of {@link DonationAlertsDonation} objects.
	 *
	 * @throws {@link HttpError} if the API response returns a non-200 status code.
	 * @throws {@link UnregisteredUserError} if the user is not registered in the authentication provider.
	 * @throws {@link MissingScopeError} if the access token lacks the `oauth-donation-index` scope.
	 * @throws {@link RateLimitError} If the Donation Alerts API rate limit is exceeded.
	 *
	 * @example
	 * ```ts
	 * const allDonations = await apiClient.donations.getAllDonations(userId);
	 * console.log(`Retrieved ${allDonations.length} donations.`);
	 * ```
	 */
	public async getAllDonations(
		user: UserIdResolvable,
		requestOptions?: DonationAlertsApiRequestOptions,
	): Promise<DonationAlertsDonation[]> {
		return await this.createDonationsPaginator(user, requestOptions).getAll();
	}

	/**
	 * Creates a paginator for fetching donation data.
	 *
	 * The paginator provides flexibility by allowing you to fetch donation data page-by-page.
	 * This is especially useful for handling large datasets incrementally.
	 *
	 * @remarks
	 * Requires the `oauth-donation-index` scope.
	 *
	 * @param user The ID of the user to fetch donations for.
	 * @param requestOptions Additional request options, such as fetch options and rate limiting,
	 * that can be used to control the request rate.
	 *
	 * @returns A {@link DonationAlertsApiPaginator} instance for donations.
	 *
	 * @throws {@link HttpError} if the API response returns a non-200 status code.
	 * @throws {@link UnregisteredUserError} if the user is not registered in the authentication provider.
	 * @throws {@link MissingScopeError} if the access token lacks the `oauth-donation-index` scope.
	 * @throws {@link RateLimitError} If the Donation Alerts API rate limit is exceeded.
	 *
	 * @example
	 * Fetch the next page
	 *
	 * ```ts
	 * const paginator = apiClient.donations.createDonationsPaginator(userId);
	 * const firstPage = await paginator.getNext();
	 * console.log(firstPage.data); // donations from the first page
	 * ```
	 *
	 * @example
	 * Iterate over paginator
	 *
	 * ```ts
	 * const paginator = apiClient.donations.createDonationsPaginator(userId);
	 *
	 * for await (const pageDonations of paginator) {
	 *     console.log(pageDonations);
	 * }
	 * ```
	 */
	public createDonationsPaginator(
		user: UserIdResolvable,
		requestOptions?: DonationAlertsApiRequestOptions,
	): DonationAlertsApiPaginator<DonationAlertsDonationData, DonationAlertsDonation> {
		return new DonationAlertsApiPaginator<DonationAlertsDonationData, DonationAlertsDonation>(
			this._apiClient,
			user,
			{
				type: 'api',
				url: 'alerts/donations',
				method: 'GET',
				scope: 'oauth-donation-index',
				auth: true,
			},
			donation => new DonationAlertsDonation(donation),
			requestOptions,
		);
	}
}
