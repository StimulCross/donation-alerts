import {
	callDonationAlertsApi,
	callDonationAlertsApiRaw,
	type DonationAlertsApiCallOptions,
	handleDonationAlertsApiResponseError,
	transformDonationAlertsResponse,
} from '@donation-alerts/api-call';
import { type AccessTokenWithUserId, type AuthProvider } from '@donation-alerts/auth';
import { extractUserId, Memoize, ReadDocumentation, type UserIdResolvable } from '@donation-alerts/common';
import { createLogger, type Logger } from '@stimulcross/logger';
import { type RateLimiter, RateLimitError, RateLimitErrorCode } from '@stimulcross/rate-limiter';
import { TokenBucketLimiter } from '@stimulcross/rate-limiter/token-bucket';
import { DonationAlertsCentrifugoApi } from './api/centrifugo/donation-alerts-centrifugo-api.js';
import { DonationAlertsCustomAlertsApi } from './api/custom-alerts/donation-alerts-custom-alerts-api.js';
import { DonationAlertsDonationsApi } from './api/donations/donation-alerts-donations-api.js';
import { DonationAlertsMerchandiseApi } from './api/merchandise/donation-alerts-merchandise-api.js';
import { DonationAlertsUsersApi } from './api/users/donation-alerts-users-api.js';
import { type ApiConfig } from './interfaces/api-config.js';
import { type DonationAlertsApiRequestOptions } from './interfaces/donation-alerts-api-request-options.js';

/**
 * The client for interacting with the Donation Alerts API.
 */
@ReadDocumentation('api')
export class ApiClient {
	private readonly _config: ApiConfig;
	private readonly _logger: Logger;
	private readonly _rateLimiter: RateLimiter;

	/**
	 * Creates a new instance of the API client.
	 *
	 * @param config The configuration options for the API client.
	 * @throws Error if the `authProvider` is not supplied in the configuration.
	 */
	constructor(config: ApiConfig) {
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		if (!config.authProvider) {
			throw new Error('No auth provider given. Please supply the `authProvider` option.');
		}

		this._config = config;
		this._logger = createLogger({ context: 'da:api', ...config.loggerOptions });

		this._rateLimiter =
			config.rateLimiter ??
			new TokenBucketLimiter({
				capacity: 1,
				refillRate: 0.95,
				limitBehavior: 'enqueue',
				loggerOptions: { ...config.loggerOptions, context: 'da:api:limiter' },
				queue: {
					capacity: 10,
					maxWaitMs: 10_000,
				},
			});
	}

	/**
	 * The authentication provider used by the client.
	 */
	public get authProvider(): AuthProvider {
		return this._config.authProvider;
	}

	/**
	 * Users API namespace.
	 *
	 * This namespace allows you to fetch user details, such as information about the authenticated user.
	 */
	@Memoize()
	public get users(): DonationAlertsUsersApi {
		return new DonationAlertsUsersApi(this);
	}

	/**
	 * Donations API namespace.
	 *
	 * This namespace provides methods for retrieving donation data.
	 */
	@Memoize()
	public get donations(): DonationAlertsDonationsApi {
		return new DonationAlertsDonationsApi(this);
	}

	/**
	 * Custom Alerts API namespace.
	 *
	 * This namespace provides methods for sending custom alerts.
	 */
	@Memoize()
	public get customAlerts(): DonationAlertsCustomAlertsApi {
		return new DonationAlertsCustomAlertsApi(this);
	}

	/**
	 *
	 * Centrifugo API namespace.
	 *
	 * This namespace provides methods for subscribing to Centrifugo channels.
	 */
	@Memoize()
	public get centrifugo(): DonationAlertsCentrifugoApi {
		return new DonationAlertsCentrifugoApi(this);
	}

	/**
	 * Merchandise API namespace.
	 *
	 * This namespace allows managing merchandise-related data.
	 */
	@Memoize()
	public get merchandise(): DonationAlertsMerchandiseApi {
		return new DonationAlertsMerchandiseApi(this);
	}

	/**
	 * Sends a request to the Donation Alerts API.
	 *
	 * @param user The ID of the user making the request.
	 * @param callOptions Options for the API call, including method, URL, and other details.
	 * @param requestOptions Options for rate limiter request.
	 *
	 * @throws {@link HttpError} If the response status code is outside the 200-299 range (excluding 429).
	 * @throws {@link UnregisteredUserError} If the specified user is not registered in the authentication provider.
	 * @throws {@link MissingScopeError} If the access token lacks the required scope to complete the request.
	 * @throws {@link RateLimitError} If the Donation Alerts API rate limit is exceeded.
	 */
	public async callApi<T = unknown>(
		user: UserIdResolvable,
		callOptions: DonationAlertsApiCallOptions,
		requestOptions?: DonationAlertsApiRequestOptions,
	): Promise<T> {
		const userId = extractUserId(user);

		const { authProvider } = this._config;
		const shouldAuth = callOptions.auth ?? true;
		let token: AccessTokenWithUserId | null = shouldAuth
			? await authProvider.getAccessTokenForUser(userId, callOptions.scope ? [callOptions.scope] : undefined)
			: null;

		if (!token) {
			return await callDonationAlertsApi<T>(callOptions, undefined, this._config.fetchOptions);
		}

		let response = await this._callApiInternal(callOptions, token.accessToken, requestOptions);

		if (response.status === 401 && authProvider.refreshAccessTokenForUser) {
			token = await authProvider.refreshAccessTokenForUser(userId);
			response = await this._callApiInternal(callOptions, token.accessToken, requestOptions);
		}

		if (response.status === 429) {
			throw new RateLimitError(RateLimitErrorCode.LimitExceeded);
		}

		await handleDonationAlertsApiResponseError(response, callOptions);
		return await transformDonationAlertsResponse<T>(response);
	}

	private async _callApiInternal(
		callOptions: DonationAlertsApiCallOptions,
		accessToken?: string,
		requestOptions?: DonationAlertsApiRequestOptions,
	): Promise<Response> {
		const fetchOptions = { ...this._config.fetchOptions, ...requestOptions?.fetchOptions };
		const type = callOptions.type ?? 'api';

		this._logger.debug(`Calling ${type}: ${callOptions.method ?? 'GET'} ${callOptions.url}`);

		if (callOptions.query) {
			this._logger.trace(`Query: ${JSON.stringify(callOptions.query)}`);
		}

		if (callOptions.jsonBody) {
			this._logger.trace(`Request JSON body: ${JSON.stringify(callOptions.jsonBody)}`);
		}

		if (callOptions.formBody) {
			this._logger.trace(`Request form body: ${JSON.stringify(callOptions.formBody)}`);
		}

		const response =
			type === 'api'
				? await this._rateLimiter.run(
						() => callDonationAlertsApiRaw(callOptions, accessToken, fetchOptions),
						requestOptions?.rateLimiterOptions,
					)
				: await callDonationAlertsApiRaw(callOptions, accessToken, fetchOptions);

		this._logger.debug(
			`Called API: ${callOptions.method ?? 'GET'} ${callOptions.url} - result: ${response.status}`,
		);

		return response;
	}
}
