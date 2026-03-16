import { type DonationAlertsCallFetchOptions } from '@donation-alerts/api-call';
import { type AuthProvider } from '@donation-alerts/auth';
import { type LoggerOptions } from '@stimulcross/logger';
import { type RateLimiter } from '@stimulcross/rate-limiter';

/**
 * Configuration options for creating an {@link ApiClient}.
 */
export interface ApiConfig {
	/**
	 * The authentication provider responsible for supplying access tokens to the client.
	 *
	 * @remarks
	 * The client uses this provider to authorize requests to the Donation Alerts API.
	 * For more details, refer to the {@link AuthProvider} documentation.
	 */
	authProvider: AuthProvider;

	/**
	 * Custom options to pass to the fetch method used for API requests.
	 */
	fetchOptions?: DonationAlertsCallFetchOptions;

	/**
	 * Configuration options for logging within the client.
	 */
	loggerOptions?: Partial<LoggerOptions>;

	/**
	 * A rate limiter instance to control the request rate to the API.
	 *
	 * Donation Alerts API allows up to 60 requests per minute per application, which translates to 1 request
	 * per second.
	 *
	 * By default, a token bucket rate limiter implementation is used strictly enforcing 1 request per second.
	 *
	 * If you need to customize the rate limiter, you can provide your own implementation or use any implementation
	 * that implements the {@link RateLimiter} interface (or at least is adapted to it).
	 *
	 * Alternatively, you can use any rate limiter implementation from the
	 * {@link https://github.com/stimulcross/rate-limiter @stimulcross/rate-limiter} package, that are already
	 * implementing the {@link RateLimiter} interface.
	 */
	rateLimiter?: RateLimiter;
}
