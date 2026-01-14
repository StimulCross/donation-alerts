import { type QueueEntryLimitReachedBehavior } from '@d-fischer/rate-limiter';

/**
 * Configuration options for the rate limiter.
 */
export interface RateLimiterOptions {
	/**
	 * Whether to limit the number of requests to 1 per second.
	 *
	 * @remarks
	 * According to the official documentation, the Donation Alerts API allows up to 60 requests per minute per
	 * application, which translates to 1 request per second.
	 *
	 * By default, the library enforces this rate limit, ensuring that requests are executed sequentially at 1 request
	 * per second. For example, if you initiate 60 simultaneous requests, they will be queued and executed one by one.
	 *
	 * If set to `false`, you can exceed the limit in a short period (e.g., 10 seconds), but subsequent requests
	 * will fail for the remaining duration of the 60-second window due to the API's rate limit.
	 *
	 * Requests exceeding the limit are enqueued and executed later by default. You can customize this behavior
	 * using the {@link RateLimiterOptions#limitReachedBehavior} property.
	 *
	 * @defaultValue `true`
	 */
	limitToOneRequestPerSecond?: boolean;

	/**
	 * Behavior to apply when the rate limit is reached.
	 *
	 * @remarks
	 * Specifies what happens if the number of requests exceeds the rate limit. The available options are:
	 * - `enqueue` - Adds the request to a queue to be executed when possible.
	 * - `throw` - Throws a `RateLimitReachedError` when the limit is exceeded.
	 * - `null` - Returns `null` instead of executing the request.
	 *
	 * @defaultValue `enqueue`
	 */
	limitReachedBehavior?: QueueEntryLimitReachedBehavior;
}
