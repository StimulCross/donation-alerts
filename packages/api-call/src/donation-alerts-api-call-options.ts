/**
 * Donation Alerts API call type.
 */
export type DonationAlertsCallType = 'api' | 'auth' | 'custom';

/**
 * Options for a single API call.
 */
export interface DonationAlertsApiCallOptions {
	/**
	 * The URL to request.
	 *
	 * @remarks
	 * If {@link DonationAlertsApiCallOptions#type} set to `api` or `auth`, this property must contain only API
	 * endpoint without the base URL.
	 *
	 * If {@link DonationAlertsApiCallOptions#type} set to `custom`, this parameter must be a full valid URL.
	 */
	url: string;

	/**
	 * The endpoint to call. Can be `api`, `auth`, or `custom`.
	 *
	 * @remarks
	 * - If this is set to `auth`, the base URL resolves to `https://www.donationalerts.com/oauth` with joined
	 * endpoint specified in {@link DonationAlertsApiCallOptions#url}.
	 *
	 * - If this is set to `api` the base URL resolves to `https://www.donationalerts.com/api/v1` with joined
	 * endpoint, specified in {@link DonationAlertsApiCallOptions#url}.
	 *
	 * - If this is set to `custom`, the URL exactly resolves to value, specified in
	 * {@link DonationAlertsApiCallOptions#url}. In this case, the URL in {@link DonationAlertsApiCallOptions#url}
	 * must be full and valid.
	 *
	 * @defaultValue `api`
	 */
	type?: DonationAlertsCallType;

	/**
	 * The HTTP method to use.
	 *
	 * @defaultValue `GET`
	 */
	method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

	/**
	 * The query parameters to send with the API call.
	 */
	query?: Record<string, string | string[] | number | number[] | undefined>;

	/**
	 * The JSON body to send with the API call.
	 */
	jsonBody?: object;

	/**
	 * The form URL encoded body to send with the API call.
	 */
	formBody?: object;

	/**
	 * The scope that the request needs.
	 */
	scope?: string;

	/**
	 * Whether OAuth credentials should be generated and sent with the request.
	 *
	 * @defaultValue `true`
	 */
	auth?: boolean;
}

/**
 * Additional fetch options.
 */
export type DonationAlertsCallFetchOptions = Omit<RequestInit, 'headers' | 'method' | 'body'>;
