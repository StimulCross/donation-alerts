import { stringify } from 'qs';
import type { DonationAlertsApiCallOptions } from '../DonationAlertsApiCallOptions';
import { HttpError } from '../errors/HttpError';

/** @internal */
export async function handleDonationAlertsApiResponseError(
	response: Response,
	options: DonationAlertsApiCallOptions
): Promise<void> {
	if (!response.ok) {
		const isJson = response.headers.get('Content-Type') === 'application/json';
		const text = isJson ? JSON.stringify(await response.json(), null, 2) : await response.text();
		const params = stringify(options.query, { arrayFormat: 'repeat', addQueryPrefix: true });
		const fullUrl = `${options.url}${params}`;
		throw new HttpError(response.status, response.statusText, fullUrl, options.method ?? 'GET', text, isJson);
	}
}

/** @internal */
export async function transformDonationAlertsResponse<T>(response: Response): Promise<T> {
	if (response.status === 204) {
		return undefined as unknown as T;
	}

	const text = await response.text();

	if (!text) {
		return undefined as unknown as T;
	}

	return JSON.parse(text) as T;
}
