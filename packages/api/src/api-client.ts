import {
	type QueueEntryLimitReachedBehavior,
	type RateLimiterRequestOptions,
	TimeBasedRateLimiter,
	TimedPassthruRateLimiter,
} from '@d-fischer/rate-limiter';
import {
	callDonationAlertsApi,
	callDonationAlertsApiRaw,
	type DonationAlertsApiCallOptions,
	type DonationAlertsCallFetchOptions,
	handleDonationAlertsApiResponseError,
	transformDonationAlertsResponse,
} from '@donation-alerts/api-call';
import { type AccessTokenWithUserId, type AuthProvider } from '@donation-alerts/auth';
import { extractUserId, ReadDocumentation, type UserIdResolvable } from '@donation-alerts/common';
import { createLogger, type Logger, type LoggerOptions } from '@stimulcross/logger';
import { nonenumerable } from '@stimulcross/shared-utils';
import { Memoize } from 'typescript-memoize';
import { DonationAlertsCentrifugoApi } from './api/centrifugo/donation-alerts-centrifugo-api';
import { DonationAlertsCustomAlertsApi } from './api/customAlerts/donation-alerts-custom-alerts-api';
import { DonationAlertsDonationsApi } from './api/donations/donation-alerts-donations-api';
import { DonationAlertsMerchandiseApi } from './api/merchandise/donation-alerts-merchandise-api';
import { DonationAlertsUsersApi } from './api/users/donation-alerts-users-api';

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

/** @internal */
export interface DonationAlertsApiCallOptionsInternal {
	options: DonationAlertsApiCallOptions;
	accessToken?: string;
	fetchOptions?: DonationAlertsCallFetchOptions;
}

/**
 * The client for interacting with the Donation Alerts API.
 */
@ReadDocumentation('api')
export class ApiClient {
	@nonenumerable private readonly _config: ApiConfig;
	@nonenumerable private readonly _logger: Logger;
	@nonenumerable private readonly _rateLimiter:
		| TimeBasedRateLimiter<DonationAlertsApiCallOptionsInternal, Response>
		| TimedPassthruRateLimiter<DonationAlertsApiCallOptionsInternal, Response>;

	@nonenumerable private readonly _limitReachedBehavior: QueueEntryLimitReachedBehavior;

	/**
	 * Creates a new instance of the API client.
	 *
	 * @param config The configuration options for the API client.
	 * @throws Error if the `authProvider` is not supplied in the configuration.
	 */
	constructor(config: ApiConfig) {
		if (!config.authProvider) {
			throw new Error('No auth provider given. Please supply the `authProvider` option.');
		}

		this._config = config;
		this._limitReachedBehavior = config.rateLimiterOptions?.limitReachedBehavior ?? 'enqueue';

		if (config.rateLimiterOptions?.limitToOneRequestPerSecond ?? true) {
			this._rateLimiter = new TimedPassthruRateLimiter(
				new TimeBasedRateLimiter({
					timeFrame: 1000,
					bucketSize: 1,
					doRequest: async (req): Promise<Response> =>
						await callDonationAlertsApiRaw(req.options, req.accessToken, req.fetchOptions),
					logger: { minLevel: 'ERROR' },
				}),
				{ bucketSize: 60, timeFrame: 60_000 },
			);
		} else {
			this._rateLimiter = new TimeBasedRateLimiter<DonationAlertsApiCallOptionsInternal, Response>({
				bucketSize: 60,
				timeFrame: 60_000,
				doRequest: async (req): Promise<Response> =>
					await callDonationAlertsApiRaw(req.options, req.accessToken, req.fetchOptions),
				logger: { minLevel: 'ERROR' },
			});
		}

		this._logger = createLogger({ context: 'da:api', ...config.logger });
	}

	/**
	 * Users API namespace.
	 *
	 * This namespace allows you to fetch user details, such as information about the authenticated user.
	 */
	@Memoize()
	get users(): DonationAlertsUsersApi {
		return new DonationAlertsUsersApi(this);
	}

	/**
	 * Donations API namespace.
	 *
	 * This namespace provides methods for retrieving donation data.
	 */
	@Memoize()
	get donations(): DonationAlertsDonationsApi {
		return new DonationAlertsDonationsApi(this);
	}

	/**
	 * Custom Alerts API namespace.
	 *
	 * This namespace provides methods for sending custom alerts.
	 */
	@Memoize()
	get customAlerts(): DonationAlertsCustomAlertsApi {
		return new DonationAlertsCustomAlertsApi(this);
	}

	/**
	 *
	 * Centrifugo API namespace.
	 *
	 * This namespace provides methods for subscribing to Centrifugo channels.
	 */
	@Memoize()
	get centrifugo(): DonationAlertsCentrifugoApi {
		return new DonationAlertsCentrifugoApi(this);
	}

	/**
	 * Merchandise API namespace.
	 *
	 * This namespace allows managing merchandise-related data.
	 */
	@Memoize()
	get merchandise(): DonationAlertsMerchandiseApi {
		return new DonationAlertsMerchandiseApi(this);
	}

	/**
	 * Sends a request to the Donation Alerts API.
	 *
	 * @param user The ID of the user making the request.
	 * @param options Options for the API call, including method, URL, and other details.
	 * @param rateLimiterOptions Options for fine-tuning rate-limiting behavior.
	 *
	 * @throws {@link HttpError} If the response status code is outside the 200-299 range.
	 * @throws {@link UnregisteredUserError} If the specified user is not registered in the authentication provider.
	 * @throws {@link MissingScopeError} If the access token lacks the required scope to complete the request.
	 */
	async callApi<T = unknown>(
		user: UserIdResolvable,
		options: DonationAlertsApiCallOptions,
		rateLimiterOptions: RateLimiterRequestOptions = {},
	): Promise<T> {
		const userId = extractUserId(user);

		const { authProvider } = this._config;
		const shouldAuth = options.auth ?? true;
		let accessToken: AccessTokenWithUserId | null = shouldAuth
			? await authProvider.getAccessTokenForUser(userId, options.scope ? [options.scope] : undefined)
			: null;

		if (!accessToken) {
			return await callDonationAlertsApi<T>(options, undefined, this._config.fetchOptions);
		}

		let response = await this._callApiInternal(options, accessToken.accessToken, rateLimiterOptions);

		if (response.status === 401 && authProvider.refreshAccessTokenForUser) {
			accessToken = await authProvider.refreshAccessTokenForUser(userId);
			response = await this._callApiInternal(options, accessToken.accessToken, rateLimiterOptions);
		}

		await handleDonationAlertsApiResponseError(response, options);
		return await transformDonationAlertsResponse<T>(response);
	}

	private async _callApiInternal(
		options: DonationAlertsApiCallOptions,
		accessToken?: string,
		rateLimiterOptions: RateLimiterRequestOptions = {},
	): Promise<Response> {
		const { fetchOptions } = this._config;
		const type = options.type ?? 'api';
		const limitReachedBehavior = rateLimiterOptions.limitReachedBehavior ?? this._limitReachedBehavior;

		this._logger.debug(`Calling ${type}: ${options.method ?? 'GET'} ${options.url}`);

		if (options.query) {
			this._logger.trace(`Query: ${JSON.stringify(options.query)}`);
		}

		if (options.jsonBody) {
			this._logger.trace(`Request JSON body: ${JSON.stringify(options.jsonBody)}`);
		}

		if (options.formBody) {
			this._logger.trace(`Request form body: ${JSON.stringify(options.formBody)}`);
		}

		const response =
			type === 'api'
				? await this._rateLimiter.request(
						{
							options,
							accessToken,
							fetchOptions,
						},
						{ limitReachedBehavior },
					)
				: await callDonationAlertsApiRaw(options, accessToken, fetchOptions);

		this._logger.debug(`Called API: ${options.method ?? 'GET'} ${options.url} - result: ${response.status}`);

		return response;
	}
}
