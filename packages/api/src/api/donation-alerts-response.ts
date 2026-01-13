/** @internal */
export interface DonationAlertsResponseData<T = unknown> {
	data: T[];
}

/** @internal */
export interface DonationAlertsResponseSingleData<T = unknown> {
	data: T;
}

/** @internal */
export interface DonationAlertsResponseLinksData {
	first: string;
	last: string;
	prev: string | null;
	next: string | null;
}

/** @internal */
export interface DonationAlertsResponseMetaData {
	current_page: number;
	from: number;
	last_page: number;
	path: string;
	per_page: number;
	to: number;
	total: number;
}

/** @internal */
export interface DonationAlertsResponseWithMeta<T = unknown> extends DonationAlertsResponseData<T> {
	links: DonationAlertsResponseLinksData;
	meta: DonationAlertsResponseMetaData;
}

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
