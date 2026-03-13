import { EventEmitter } from '@d-fischer/typed-event-emitter';
import { callDonationAlertsApi } from '@donation-alerts/api-call';
import { extractUserId, ReadDocumentation, type UserIdResolvable } from '@donation-alerts/common';
import { InvalidTokenError } from '../errors/invalid-token.error.js';
import { UnregisteredUserError } from '../errors/unregistered-user.error.js';
import { type AccessToken, type AccessTokenWithUserId } from '../interfaces/access-token.js';
import { type AuthProvider } from '../interfaces/auth-provider.js';
import { type AuthStorage } from '../interfaces/auth-storage.js';
import { MemoryAuthStorageAdapter } from '../storages/memory-auth-storage.adapter.js';
import { getAccessToken, isAccessTokenExpired, refreshAccessToken } from '../utils/access-token-utils.js';
import { compareScopes } from '../utils/scope-utils.js';

/**
 * Configuration for {@link RefreshingAuthProvider}.
 */
export interface RefreshingAuthProviderConfig {
	/**
	 * The Donation Alerts client ID.
	 */
	clientId: string;

	/**
	 * The Donation Alerts client secret.
	 *
	 * @remarks
	 * This is required to refresh expired tokens for any user. If you do not need token refreshing,
	 * you may opt for {@link StaticAuthProvider}.
	 */
	clientSecret: string;

	/**
	 * A redirect URI configured in your application settings.
	 *
	 * @remarks
	 * This is required only if you intend to use the {@link RefreshingAuthProvider#addUserForCode} method.
	 */
	redirectUri?: string;

	/**
	 * The list of scopes that all registering tokens must include.
	 *
	 * If scopes are specified for the token being registered, it will be compared against the scopes from this option.
	 * If the token misses any scope from this list then {@link MissingScopeError} exception will be thrown.
	 */
	scopes?: string[];

	/**
	 * The storage adapter to use for storing tokens.
	 *
	 * By default, an in-memory storage adapter is used.
	 *
	 * If your application is multi-process, you should implement a shared storage adapter such as Redis.
	 */
	storage?: AuthStorage;
}

/**
 * An authentication provider that automatically refreshes user access tokens when they expire.
 */
@ReadDocumentation('events')
export class RefreshingAuthProvider extends EventEmitter implements AuthProvider {
	private readonly _config: RefreshingAuthProviderConfig;
	private readonly _storage: AuthStorage;

	/**
	 * Fires when a user's token is successfully refreshed.
	 *
	 * @param userId The ID of the user whose token was refreshed.
	 * @param token The updated {@link AccessToken} object.
	 */
	public readonly onRefresh = this.registerEvent<[userId: number, token: AccessToken]>();

	/**
	 * Creates a new instance of the `RefreshingAuthProvider`.
	 *
	 * @param config The configuration object that defines client credentials and settings.
	 */
	constructor(config: RefreshingAuthProviderConfig) {
		super();

		if (!config.clientId || !config.clientSecret) {
			throw new Error('Donation Alerts client ID and secret are required to create a RefreshingAuthProvider');
		}

		this._config = config;
		this._storage = config.storage ?? new MemoryAuthStorageAdapter();
	}

	public get clientId(): string {
		return this._config.clientId;
	}

	public get clientSecret(): string {
		return this._config.clientSecret;
	}

	/**
	 * Checks whether the specified user is registered in this provider.
	 *
	 * @param user The ID of the user to check.
	 */
	public async hasUser(user: UserIdResolvable): Promise<boolean> {
		return Boolean(await this._storage.get(extractUserId(user)));
	}

	/**
	 * Adds a user to this provider, associating them with the provided token data.
	 *
	 * @param user The ID of the user to add.
	 * @param token The token data, including refresh and access tokens.
	 *
	 * @throws {@link InvalidTokenError} if the access or refresh tokens are invalid.
	 * @throws {@link MissingScopeError} if the token does not match the required scopes.
	 */
	public async addUser(user: UserIdResolvable, token: AccessToken): Promise<AccessTokenWithUserId> {
		const userId = extractUserId(user);

		this._validateToken(token, userId);

		if (token.scopes) {
			compareScopes(token.scopes, this._config.scopes, userId);
		}

		await this._storage.set(userId, token);
		return { userId, ...token };
	}

	/**
	 * Determines the user ID from an access token and registers that user.
	 *
	 * If you already know the user's ID, using {@link addUser} might be preferable.
	 *
	 * @param token The token data, including refresh and access tokens.
	 */
	public async addUserForToken(token: AccessToken): Promise<AccessTokenWithUserId> {
		this._validateToken(token);

		let accessToken = token;
		let isTokenRefreshed = false;

		if (isAccessTokenExpired(accessToken)) {
			accessToken = await refreshAccessToken(
				this._config.clientId,
				this._config.clientSecret,
				accessToken.refreshToken,
				this._config.scopes,
			);
			isTokenRefreshed = true;
		}

		const user = await callDonationAlertsApi<{ data: { id: number } }>(
			{ type: 'api', url: 'user/oauth' },
			accessToken.accessToken,
		);
		const userId = user.data.id;

		if (accessToken.scopes) {
			compareScopes(accessToken.scopes, this._config.scopes, userId);
		}

		await this.addUser(userId, accessToken);

		if (isTokenRefreshed) {
			this.emit(this.onRefresh, userId, accessToken);
		}

		return { ...accessToken, userId };
	}

	/**
	 * Exchanges a grant authorization code for an access token and registers the user in this auth provider.
	 *
	 * @remarks
	 * The `redirectUri` option must be specified in {@link RefreshingAuthProviderConfig} to complete
	 * this flow successfully.
	 *
	 * @param code The authorization code.
	 * @param scopes Optional scopes that the user granted when retrieving the code. These scopes will be compared
	 * against the scopes specified in the constructor.
	 */
	public async addUserForCode(code: string, scopes?: string[]): Promise<AccessTokenWithUserId> {
		if (!this._config.redirectUri) {
			throw new Error('Exchanging authorization code requires "redirectUri" option to be specified');
		}

		const token = await getAccessToken(
			this._config.clientId,
			this._config.clientSecret,
			this._config.redirectUri,
			code,
		);

		const user = await callDonationAlertsApi<{ data: { id: number } }>(
			{ type: 'api', url: 'user/oauth' },
			token.accessToken,
		);

		token.scopes = scopes;

		if (token.scopes) {
			compareScopes(token.scopes, this._config.scopes, user.data.id);
		}

		await this.addUser(user.data.id, token);
		this.emit(this.onRefresh, user.data.id, token);

		return { ...token, userId: user.data.id };
	}

	/**
	 * Removes a user from this provider.
	 *
	 * @param user The ID of the user to remove.
	 */
	public async removeUser(user: UserIdResolvable): Promise<void> {
		await this._storage.delete(extractUserId(user));
	}

	public async getScopesForUser(user: UserIdResolvable): Promise<string[]> {
		const userId = extractUserId(user);
		const token = await this._storage.get(userId);

		if (!token) {
			throw new UnregisteredUserError(
				userId,
				`User "${userId}" could not be located in the authentication provider registry. Please add the user first by using one of the following methods: addUser, addUserForToken, or addUserForCode`,
			);
		}

		return token.scopes ?? [];
	}

	public async getAccessTokenForUser(user: UserIdResolvable, scopes?: string[]): Promise<AccessTokenWithUserId> {
		const userId = extractUserId(user);

		const currentToken = await this._storage.get(userId);

		if (!currentToken) {
			throw new UnregisteredUserError(
				userId,
				`User "${userId}" could not be located in the authentication provider registry. Please add the user first by using one of the following methods: addUser, addUserForToken, or addUserForCode.
`,
			);
		}

		if (currentToken.accessToken && !isAccessTokenExpired(currentToken)) {
			if (currentToken.scopes) {
				compareScopes(currentToken.scopes, scopes, userId);
			}

			return { ...currentToken, userId };
		}

		const newToken = await this.refreshAccessTokenForUser(userId);
		newToken.scopes = currentToken.scopes;

		if (newToken.scopes) {
			compareScopes(newToken.scopes, scopes, userId);
		}

		return { ...newToken, userId };
	}

	/**
	 * Forces a token refresh for the specified user and updates the provider's registry accordingly.
	 *
	 * @param user The ID of the user to add.
	 *
	 * @throws {@link UnregisteredUserError} if the user is not registered in this provider.
	 * @throws {@link InvalidTokenError} if the refresh token is missing or invalid.
	 */
	public async refreshAccessTokenForUser(user: UserIdResolvable): Promise<AccessTokenWithUserId> {
		const userId = extractUserId(user);

		const currentToken = await this._storage.get(userId);

		if (!currentToken) {
			throw new UnregisteredUserError(
				userId,
				`User "${userId}" could not be located in the authentication provider registry. Please add the user first by using one of the following methods: addUser, addUserForToken, or addUserForCode.`,
			);
		}

		if (!currentToken.refreshToken) {
			throw new InvalidTokenError(
				userId,
				`Unable to refresh access token for user "${userId}". Refresh token is not specified.`,
			);
		}

		const newToken = await refreshAccessToken(
			this._config.clientId,
			this._config.clientSecret,
			currentToken.refreshToken,
		);

		await this._storage.set(userId, newToken);
		this.emit(this.onRefresh, userId, newToken);

		return { ...newToken, userId };
	}

	private _validateToken(token: AccessToken, userId?: number): void {
		if (!token.accessToken) {
			throw new InvalidTokenError(
				userId ?? null,
				`The access token of user "${userId}" is invalid. Make sure it's a non-empty string.`,
			);
		}

		if (!token.refreshToken) {
			throw new InvalidTokenError(
				userId ?? null,
				`The refresh token of user "${userId}" is invalid. Make sure it's a non-empty string.`,
			);
		}
	}
}
