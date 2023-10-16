import {
	type QueueEntryLimitReachedBehavior,
	type RateLimiterRequestOptions,
	TimeBasedRateLimiter,
	TimedPassthruRateLimiter
} from '@d-fischer/rate-limiter';
import {
	callDonationAlertsApi,
	callDonationAlertsApiRaw,
	type DonationAlertsApiCallOptions,
	type DonationAlertsCallFetchOptions,
	handleDonationAlertsApiResponseError,
	transformDonationAlertsResponse
} from '@donation-alerts/api-call';
import { type AccessTokenWithUserId, type AuthProvider } from '@donation-alerts/auth';
import { extractUserId, ReadDocumentation, type UserIdResolvable } from '@donation-alerts/common';
import { createLogger, type Logger, type LoggerOptions } from '@stimulcross/logger';
import { nonenumerable } from '@stimulcross/shared-utils';
import { stringify } from 'qs';
import { Memoize } from 'typescript-memoize';
import { DonationAlertsCentrifugoApi } from './api/centrifugo/DonationAlertsCentrifugoApi';
import { DonationAlertsCustomAlertsApi } from './api/customAlerts/DonationAlertsCustomAlertsApi';
import { DonationAlertsDonationsApi } from './api/donations/DonationAlertsDonationsApi';
import { DonationAlertsMerchandiseApi } from './api/merchandise/DonationAlertsMerchandiseApi';
import { DonationAlertsUsersApi } from './api/users/DonationAlertsUsersApi';

/**
 * Defines the rate limiter options.
 */
export interface RateLimiterOptions {
	/**
	 * Limits the number of requests per second to one.
	 *
	 * @remarks
	 * According to the official documentation, Donation Alerts API limits requests to the API methods for each
	 * application by 60 requests per minute, making it 1 request per second.
	 *
	 * The library, by default, limits the number of requests to 1 per second. This means that if you run,
	 * for example, 60 concurrent requests at the same time, they will be executed sequentially at 1 request per second.
	 *
	 * If you set this option to `false`, you can reach the rate limit let's say in 10 seconds, and the library will not
	 * be able to send requests for the remaining 50 seconds of the available 60 seconds timeframe.
	 *
	 * By default, all requests enqueued to execute later when possible. You can change this behavior by setting
	 * {@link RateLimiterOptions#limitReachedBehavior} property.
	 *
	 * @defaultValue `true`
	 */
	limitToOneRequestPerSecond?: boolean;

	/**
	 * Defines behavior when the rate limit is reached.
	 *
	 * @remarks
	 * The possible values are:
	 * - `enqueue` - Enqueues the request and send it when possible.
	 * - `throw` - Throws the `RateLimitReachedError` exception when rate limit is reached.
	 * - `null` - Returns `null` when rate limit is reached.
	 *
	 * @defaultValue `enqueue`
	 */
	limitReachedBehavior?: QueueEntryLimitReachedBehavior;
}

/**
 * Configuration for {@link ApiClient} instance.
 */
export interface ApiConfig {
	/**
	 * An authentication provider that supplies tokens to the client.
	 *
	 * For more information, see the {@link AuthProvider} documentation.
	 */
	authProvider: AuthProvider;

	/**
	 * Additional options to pass to the fetch method.
	 */
	fetchOptions?: DonationAlertsCallFetchOptions;

	/**
	 * Options to pass to the logger.
	 */
	logger?: LoggerOptions;

	/**
	 * Defines the rate limiter options.
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
 * The client to interact with Donation Alerts API.
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
	 * Creates a new API client instance.
	 *
	 * @param config The API client configuration.
	 */
	constructor(config: ApiConfig) {
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
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
					logger: { minLevel: 'ERROR' }
				}),
				{ bucketSize: 60, timeFrame: 60000 }
			);
		} else {
			this._rateLimiter = new TimeBasedRateLimiter<DonationAlertsApiCallOptionsInternal, Response>({
				bucketSize: 60,
				timeFrame: 60000,
				doRequest: async (req): Promise<Response> =>
					await callDonationAlertsApiRaw(req.options, req.accessToken, req.fetchOptions),
				logger: { minLevel: 'ERROR' }
			});
		}

		this._logger = createLogger({ context: 'da:api', ...config.logger });
	}

	/**
	 * Donation Alerts `Users` API namespace.
	 */
	@Memoize()
	get users(): DonationAlertsUsersApi {
		return new DonationAlertsUsersApi(this);
	}

	/**
	 * Donation Alerts `Donations` API namespace.
	 */
	@Memoize()
	get donations(): DonationAlertsDonationsApi {
		return new DonationAlertsDonationsApi(this);
	}

	/**
	 * Donation Alerts `Custom Alerts` API namespace.
	 */
	@Memoize()
	get customAlerts(): DonationAlertsCustomAlertsApi {
		return new DonationAlertsCustomAlertsApi(this);
	}

	/**
	 * Donation Alerts `Centrifugo` API namespace.
	 */
	@Memoize()
	get centrifugo(): DonationAlertsCentrifugoApi {
		return new DonationAlertsCentrifugoApi(this);
	}

	/**
	 * Donation Alerts `Merchandise` API namespace.
	 */
	@Memoize()
	get merchandise(): DonationAlertsMerchandiseApi {
		return new DonationAlertsMerchandiseApi(this);
	}

	/**
	 * Makes a call to the Donation Alerts API.
	 *
	 * @param user The ID of the user.
	 * @param options The API call options.
	 * @param rateLimiterOptions The rate limiter options.
	 *
	 * @throws {@link HttpError} if response status code is out of 200-299 range.
	 * @throws {@link UnregisteredUserError} if the user you are trying to get is not registered in authentication provider.
	 * @throws {@link MissingScopeError} if the access token does not have required scope.
	 */
	async callApi<T = unknown>(
		user: UserIdResolvable,
		options: DonationAlertsApiCallOptions,
		rateLimiterOptions: RateLimiterRequestOptions = {}
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
		rateLimiterOptions: RateLimiterRequestOptions = {}
	): Promise<Response> {
		const { fetchOptions } = this._config;
		const type = options.type ?? 'api';
		const limitReachedBehavior = rateLimiterOptions.limitReachedBehavior ?? this._limitReachedBehavior;

		this._logger.debug(`Calling ${type} API: ${options.method ?? 'GET'} ${options.url}`);
		this._logger.trace(`Query: ${JSON.stringify(options.query)}`);

		if (options.jsonBody) {
			this._logger.trace(`Request body: ${JSON.stringify(options.jsonBody)}`);
		}

		if (options.formBody) {
			this._logger.trace(`Request body: ${stringify(options.formBody)}`);
		}

		const response =
			type === 'api'
				? await this._rateLimiter.request(
						{
							options,
							accessToken,
							fetchOptions
						},
						{ limitReachedBehavior }
				  )
				: await callDonationAlertsApiRaw(options, accessToken, fetchOptions);

		this._logger.debug(`Called API: ${options.method ?? 'GET'} ${options.url} - result: ${response.status}`);

		return response;
	}
}
