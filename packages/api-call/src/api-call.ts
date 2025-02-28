import { stringify } from 'qs';
import {
	type DonationAlertsApiCallOptions,
	type DonationAlertsCallFetchOptions,
} from './donation-alerts-api-call-options';
import { handleDonationAlertsApiResponseError, transformDonationAlertsResponse } from './helpers/transform';
import { getDonationAlertsApiUrl } from './helpers/url';

/**
 * Makes a raw HTTP call to the Donation Alerts API with the given options and returns the raw {@link Response}
 * object.
 *
 * @remarks
 * This function is a low-level utility for interacting with the Donation Alerts API.
 * It constructs the request, appends query parameters and headers (including authorization),
 * and sends the request using the Fetch API. Use this function if you need access to the full response
 * object, including headers, status, etc.
 *
 * @param options The configuration of the API call, such as URL, method, query parameters, and body.
 * @param accessToken The OAuth access token to authorize the request. If not provided, the request may fail
 * unless the endpoint does not require authentication.
 * @param fetchOptions Additional configuration for the Fetch API, such as `credentials`, `cache`, etc.
 *
 * @returns A promise resolving to the raw {@link Response} object from the Fetch API.
 *
 * @example
 * ```ts
 * const response = await callDonationAlertsApiRaw(
 *   { url: 'user/oauth', type: 'api' },
 *   'your-access-token'
 * );
 * console.log(await response.json()); // Logs the response body
 * ```
 */
export async function callDonationAlertsApiRaw(
	options: DonationAlertsApiCallOptions,
	accessToken?: string,
	fetchOptions: DonationAlertsCallFetchOptions = {},
): Promise<Response> {
	const type = options.type ?? 'api';
	const url = getDonationAlertsApiUrl(options.url, type);
	const params = stringify(options.query, { arrayFormat: 'repeat', addQueryPrefix: true });

	const headers = new Headers();
	headers.append('Accept', 'application/json');

	let body: string | undefined;

	if (options.jsonBody) {
		body = JSON.stringify(options.jsonBody);
		headers.append('Content-Type', 'application/json');
	} else if (options.formBody) {
		body = stringify(options.formBody);
		headers.append('Content-Type', 'application/x-www-form-urlencoded');
	}

	if (accessToken) {
		headers.append('Authorization', `Bearer ${accessToken}`);
	}

	const requestOptions: RequestInit = {
		...fetchOptions,
		method: options.method ?? 'GET',
		headers,
		body: body ?? null,
	};

	return await fetch(`${url}${params}`, requestOptions);
}

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
