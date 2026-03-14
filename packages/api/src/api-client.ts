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
	handleDonationAlertsApiResponseError,
	transformDonationAlertsResponse,
} from '@donation-alerts/api-call';
import { type AccessTokenWithUserId, type AuthProvider } from '@donation-alerts/auth';
import { extractUserId, Memoize, ReadDocumentation, type UserIdResolvable } from '@donation-alerts/common';
import { createLogger, type Logger } from '@stimulcross/logger';
import { DonationAlertsCentrifugoApi } from './api/centrifugo/donation-alerts-centrifugo-api.js';
import { DonationAlertsCustomAlertsApi } from './api/custom-alerts/donation-alerts-custom-alerts-api.js';
import { DonationAlertsDonationsApi } from './api/donations/donation-alerts-donations-api.js';
import { DonationAlertsMerchandiseApi } from './api/merchandise/donation-alerts-merchandise-api.js';
import { DonationAlertsUsersApi } from './api/users/donation-alerts-users-api.js';
import { type ApiConfig } from './interfaces/api-config.js';
import { type DonationAlertsApiCallOptionsInternal } from './interfaces/donation-alerts-api-call-options-internal.js';

/**
 * The client for interacting with the Donation Alerts API.
 */
@ReadDocumentation('api')
export class ApiClient {
	private readonly _config: ApiConfig;
	private readonly _logger: Logger;
	private readonly _rateLimiter:
		| TimeBasedRateLimiter<DonationAlertsApiCallOptionsInternal, Response>
		| TimedPassthruRateLimiter<DonationAlertsApiCallOptionsInternal, Response>;

	private readonly _limitReachedBehavior: QueueEntryLimitReachedBehavior;

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
		this._limitReachedBehavior = config.rateLimiterOptions?.limitReachedBehavior ?? 'enqueue';

		this._rateLimiter =
			(config.rateLimiterOptions?.limitToOneRequestPerSecond ?? true)
				? new TimedPassthruRateLimiter(
						new TimeBasedRateLimiter({
							timeFrame: 1000,
							bucketSize: 1,
							doRequest: async (req): Promise<Response> =>
								await callDonationAlertsApiRaw(req.options, req.accessToken, req.fetchOptions),
							logger: { minLevel: 'ERROR' },
						}),
						{ bucketSize: 60, timeFrame: 60_000 },
					)
				: new TimeBasedRateLimiter<DonationAlertsApiCallOptionsInternal, Response>({
						bucketSize: 60,
						timeFrame: 60_000,
						doRequest: async (req): Promise<Response> =>
							await callDonationAlertsApiRaw(req.options, req.accessToken, req.fetchOptions),
						logger: { minLevel: 'ERROR' },
					});

		this._logger = createLogger({ context: 'da:api', ...config.loggerOptions });
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
	 * @param options Options for the API call, including method, URL, and other details.
	 * @param rateLimiterOptions Options for fine-tuning rate-limiting behavior.
	 *
	 * @throws {@link HttpError} If the response status code is outside the 200-299 range.
	 * @throws {@link UnregisteredUserError} If the specified user is not registered in the authentication provider.
	 * @throws {@link MissingScopeError} If the access token lacks the required scope to complete the request.
	 */
	public async callApi<T = unknown>(
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
