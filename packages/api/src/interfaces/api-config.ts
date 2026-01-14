import { type DonationAlertsCallFetchOptions } from '@donation-alerts/api-call';
import { type AuthProvider } from '@donation-alerts/auth';
import { type LoggerOptions } from '@stimulcross/logger';
import { type RateLimiterOptions } from './rate-limiter-options.js';

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
	logger?: Partial<LoggerOptions>;

	/**
	 * Settings for the rate limiter that controls the request rate to the API.
	 */
	rateLimiterOptions?: RateLimiterOptions;
}
