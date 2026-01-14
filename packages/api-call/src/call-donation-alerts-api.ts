import { callDonationAlertsApiRaw } from './call-donation-alerts-api-raw.js';
import {
	type DonationAlertsApiCallOptions,
	type DonationAlertsCallFetchOptions,
} from './interfaces/donation-alerts-api-call-options.js';
import { handleDonationAlertsApiResponseError, transformDonationAlertsResponse } from './utils/transform-response.js';

/**
 * Makes an HTTP call to the Donation Alerts API and processes the response.
 *
 * @remarks
 * This function builds on {@link callDonationAlertsApiRaw} by handling errors and transforming the response.
 * It ensures responses with non-success status codes (e.g., 400, 500) are properly handled and raises
 * an {@link HttpError}, allowing you to manage errors gracefully in your application.
 *
 * The response is transformed into the expected data type (`T`) if the call succeeds.
 *
 * @param options The configuration of the API call, such as URL, method, query parameters, and body.
 * @param accessToken The OAuth access token to authorize the request. If not provided, the request may fail
 * unless the endpoint does not require authentication.
 * @param fetchOptions Additional configuration for the Fetch API, such as `credentials`, `cache`, etc.
 *
 * @typeParam T The expected type of the response data.
 *
 * @returns A promise that resolves to the transformed response of type `T`.
 *
 * @throws {@link HttpError} if the response has a non-success HTTP status code (outside 200-299 range).
 *
 * @example
 * ```ts
 * try {
 *     const data = await callDonationAlertsApi<{ id: number; name: string }>(
 *         { url: 'user/oauth', type: 'api' },
 *         'your-access-token'
 *     );
 *
 *     console.log(data);
 * } catch (e) {
 *     console.error('Failed to fetch user:', e);
 * }
 * ```
 */
export async function callDonationAlertsApi<T>(
	options: DonationAlertsApiCallOptions,
	accessToken?: string,
	fetchOptions: DonationAlertsCallFetchOptions = {},
): Promise<T> {
	const response = await callDonationAlertsApiRaw(options, accessToken, fetchOptions);

	await handleDonationAlertsApiResponseError(response, options);
	return await transformDonationAlertsResponse<T>(response);
}
