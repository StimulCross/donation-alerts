/**
 * The type of API calls within the Donation Alerts system.
 *
 * @remarks
 * Specifies which Donation Alerts service or endpoint the call is targeting.
 * - `api`: The request will use the `https://www.donationalerts.com/api/v1` base URL, combining it with the `url`.
 * - `auth`: The request will use the `https://www.donationalerts.com/oauth` base URL, combining it with the `url`.
 * - `custom`: The request will not modify or override the `url` property. The `url` must be a fully-formed valid URL.
 */
export type DonationAlertsCallType = 'api' | 'auth' | 'custom';

/**
 * Options for configuring a single Donation Alerts API call.
 */
export interface DonationAlertsApiCallOptions {
	/**
	 * The URL or endpoint for the API call.
	 *
	 * @remarks
	 * - If `type` is set to `api` or `auth`, this property should specify only the endpoint portion
	 *   (e.g., `alerts/donations` for `api` or `oauth/token` for `auth`), excluding the base URL.
	 * - If `type` is set to `custom`, a full and valid URL must be provided (e.g. `https://example.com/my-endpoint`).
	 *
	 * @example
	 * Calling `api` endpoints:
	 * ```ts
	 * const options: DonationAlertsApiCallOptions = {
	 *   url: "alerts/donations",
	 *   type: "api"
	 * };
	 * ```
	 *
	 * @example
	 * Calling `auth` endpoints:
	 * ```ts
	 * const options: DonationAlertsApiCallOptions = {
	 *   url: "oauth/token",
	 *   type: "auth",
	 *   method: "POST"
	 * };
	 * ```
	 */
	url: string;

	/**
	 * The type of API call to make: `api`, `auth`, or `custom`.
	 *
	 * @remarks
	 * - `api`: The request will use the `https://www.donationalerts.com/api/v1` base URL, combining it with the `url`.
	 * - `auth`: The request will use the `https://www.donationalerts.com/oauth` base URL, combining it with the `url`.
	 * - `custom`: The request will not modify or override the `url` property. The `url` must be a fully formed valid URL.
	 *
	 * @defaultValue `api`
	 */
	type?: DonationAlertsCallType;

	/**
	 * The HTTP method to use for the API call.
	 *
	 * @defaultValue `GET`
	 */
	method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

	/**
	 * The query parameters to include with the API call.
	 *
	 * @remarks
	 * This should be supplied as a key-value object, where values can be strings, numbers, arrays,
	 * or `null/undefined`.
	 */
	query?: Record<string, string | string[] | number | number[] | undefined | null>;

	/**
	 * The JSON body to send with the API call.
	 *
	 * @remarks
	 * This is only used when the HTTP method allows a body (e.g., `POST`, `PUT`).
	 * The body will be serialized into JSON before being sent.
	 */
	jsonBody?: object;

	/**
	 * The form URL encoded body to send with the API call.
	 *
	 * @remarks
	 * This is similar to `jsonBody`, but the body is URL-encoded instead of JSON. It's used
	 * for `application/x-www-form-urlencoded` content type.
	 */
	formBody?: object;

	/**
	 * The OAuth scope required for this request.
	 *
	 * @remarks
	 * The specified scope determines whether the request has sufficient authorization to access the
	 * requested resource.
	 */
	scope?: string;

	/**
	 * Indicates whether OAuth credentials should be generated and appended to the request.
	 *
	 * @defaultValue `true`
	 */
	auth?: boolean;
}

/**
 * Additional fetch options for customizing the HTTP request.
 *
 * @remarks
 * These options extend the native `RequestInit` type, excluding `headers`, `method`, and `body` as
 * those are managed separately by `DonationAlertsApiCallOptions`.
 */
export type DonationAlertsCallFetchOptions = Omit<RequestInit, 'headers' | 'method' | 'body'>;
