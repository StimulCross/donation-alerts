/// <reference lib="dom" />

// eslint-disable-next-line @typescript-eslint/no-shadow
import fetch, { Headers } from 'cross-fetch';
import { stringify } from 'qs';
import type { DonationAlertsApiCallOptions, DonationAlertsCallFetchOptions } from './DonationAlertsApiCallOptions';
import { getDonationAlertsApiUrl } from './helpers/url';
import { handleDonationAlertsApiResponseError, transformDonationAlertsResponse } from './helpers/transform';

/**
 * Makes a call to the Donation Alerts API with the given options. Returns raw Response object.
 *
 * @param options The configuration of the call.
 * @param accessToken The access token to call the API with.
 * @param fetchOptions Additional options to be passed to the `fetch` function.
 */
export async function callDonationAlertsApiRaw(
	options: DonationAlertsApiCallOptions,
	accessToken?: string,
	fetchOptions: DonationAlertsCallFetchOptions = {}
): Promise<Response> {
	const type = options.type ?? 'api';
	const url = getDonationAlertsApiUrl(options.url, type);
	const params = stringify(options.query, { arrayFormat: 'repeat', addQueryPrefix: true });
	// eslint-disable-next-line @typescript-eslint/naming-convention
	const headers = new Headers({ Accept: 'application/json' });

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
		body
	};

	return await fetch(`${url}${params}`, requestOptions);
}

/**
 * Makes a call to the Donation Alerts API with the given options.
 *
 * @param options The configuration of the call.
 * @param accessToken The access token to call the API with.
 * @param fetchOptions Additional options to be passed to the `fetch` function.
 *
 * @throws {@link HttpError} if response status code is out of 200-299 range.
 */
export async function callDonationAlertsApi<T>(
	options: DonationAlertsApiCallOptions,
	accessToken?: string,
	fetchOptions: DonationAlertsCallFetchOptions = {}
): Promise<T> {
	const response = await callDonationAlertsApiRaw(options, accessToken, fetchOptions);

	await handleDonationAlertsApiResponseError(response, options);
	return await transformDonationAlertsResponse<T>(response);
}
