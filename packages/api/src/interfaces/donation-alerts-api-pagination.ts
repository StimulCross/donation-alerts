/**
 * Represents pagination parameters for a Donation Alerts API request.
 *
 * @remarks
 * This interface allows specifying pagination details to navigate through paginated API responses.
 */
export interface DonationAlertsApiPagination {
	/**
	 * The number of the page to request.
	 *
	 * @remarks
	 * If this parameter is omitted, the API will default to the first page.
	 */
	page?: number;
}
