import { type DonationAlertsCallFetchOptions } from '@donation-alerts/api-call';
import { type RateLimiterRunOptions } from '@stimulcross/rate-limiter';

export interface DonationAlertsApiRequestOptions {
	/**
	 * Custom options to pass to the fetch method used for this request.
	 *
	 * @remarks
	 * `body`, `headers`, and `method` are not allowed to be set here.
	 */
	fetchOptions?: DonationAlertsCallFetchOptions;

	/**
	 * The rate limiter options to use for this request.
	 *
	 * Depending on the implementation, some options may not work.
	 * The default rate limiter supports all options.
	 */
	rateLimiterOptions?: RateLimiterRunOptions;
}
