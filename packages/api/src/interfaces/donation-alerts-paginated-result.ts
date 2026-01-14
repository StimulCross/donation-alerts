/**
 * Pagination details for paginated responses.
 */
export interface DonationAlertsResultPagination {
	/**
	 * The current page number.
	 */
	currentPage: number;

	/**
	 * The total number of pages.
	 */
	lastPage: number;

	/**
	 * The number of items per page.
	 */
	perPage: number;

	/**
	 * The index of the first item on the current page.
	 */
	from: number;

	/**
	 * The index of the last item on the current page.
	 */
	to: number;

	/**
	 * The total number of items.
	 */
	total: number;
}

/**
 * A paginated response from the Donation Alerts API.
 */
export interface DonationAlertsPaginatedResult<T = unknown> {
	/**
	 * The items on the current page.
	 */
	data: T[];

	/**
	 * Pagination details.
	 */
	pagination: DonationAlertsResultPagination;
}
