import { EventEmitter } from '@d-fischer/typed-event-emitter';
import { callDonationAlertsApi } from '@donation-alerts/api-call';
import { extractUserId, ReadDocumentation, type UserIdResolvable } from '@donation-alerts/common';
import { nonenumerable } from '@stimulcross/shared-utils';
import { type AuthProvider } from './auth-provider';
import { type AccessToken, type AccessTokenWithUserId, isAccessTokenExpired } from '../access-token';
import { InvalidTokenError, UnregisteredUserError } from '../errors';
import { compareScopes, getAccessToken, refreshAccessToken } from '../helpers';

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
	 * In order to refresh the access token for a user, you must provide the application client secret.
	 *
	 * That's why it's not safe to use {@link RefreshingAuthProvider} on the frontend, because it will leak application
	 * client secret.
	 */
	clientSecret: string;

	/**
	 * A valid redirect URI for your application.
	 *
	 * Only required if you intend to use {@link RefreshingAuthProvider#addUserForCode}.
	 */
	redirectUri?: string;

	/**
	 * The list of scopes that all registering tokens must include.
	 *
	 * If scopes are specified for the token being registered, it will be compared against the scopes from this option.
	 * If the token misses any scope from this list then {@link MissingScopeError} exception will be thrown.
	 */
	scopes?: string[];
}

/**
 * An authentication provider implementation that uses user refresh tokens to automatically refresh the access token
 * whenever necessary.
 */
@ReadDocumentation('events')
export class RefreshingAuthProvider extends EventEmitter implements AuthProvider {
	@nonenumerable private readonly _config: RefreshingAuthProviderConfig;
	@nonenumerable private readonly _registry = new Map<number, AccessToken>();
	@nonenumerable private readonly _newTokenPromises = new Map<number, Promise<AccessToken>>();

	/**
	 * Fires when a user's token is successfully refreshed.
	 *
	 * @param userId The ID of the user the token belongs to.
	 * @param token The refreshed {@link AccessToken} object.
	 */
	readonly onRefresh = this.registerEvent<[userId: number, token: AccessToken]>();

	/**
	 * Creates a new authentication provider that can automatically refresh tokens.
	 *
	 * @param config The configuration object.
	 */
	constructor(config: RefreshingAuthProviderConfig) {
		super();
		this._config = config;
	}

	get clientId(): string {
		return this._config.clientId;
	}

	/**
	 * Checks whether a user was added to the provider.
	 *
	 * @param user The user to check.
	 */
	hasUser(user: UserIdResolvable): boolean {
		return this._registry.has(extractUserId(user));
	}

	/**
	 * Adds a user to the auth provider registry.
	 *
	 * @param user The ID of the user.
	 * @param token The initial token data.
	 */
	addUser(user: UserIdResolvable, token: AccessToken): AccessTokenWithUserId {
		const userId = extractUserId(user);

		this._validateToken(token, userId);

		if (token.scopes) {
			compareScopes(token.scopes, this._config.scopes, userId);
		}

		this._registry.set(userId, token);
		return { userId, ...token };
	}

	/**
	 * Finds out the user associated to the given access token and adds them to the provider.
	 *
	 * If you already know the ID of the user you are adding,
	 * consider using {@link RefreshingAuthProvider#addUser} instead.
	 *
	 * @param token The initial token data.
	 */
	async addUserForToken(token: AccessToken): Promise<AccessTokenWithUserId> {
		this._validateToken(token);

		let accessToken = token;
		let isTokenRefreshed = false;

		if (!isAccessTokenExpired(accessToken)) {
			accessToken = await refreshAccessToken(
				this._config.clientId,
				this._config.clientSecret,
				accessToken.refreshToken!,
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

		this.addUser(userId, accessToken);

		if (isTokenRefreshed) {
			this.emit(this.onRefresh, userId, accessToken);
		}

		return { ...accessToken, userId };
	}

	/**
	 * Exchanges an authorization code for an access token and adds the user to the provider.
	 *
	 * @param code The authorization code.
	 * @param scopes The authorization code.
	 */
	async addUserForCode(code: string, scopes?: string[]): Promise<AccessTokenWithUserId> {
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

		this.addUser(user.data.id, token);
		this.emit(this.onRefresh, user.data.id, token);

		return { ...token, userId: user.data.id };
	}

	/**
	 * Removes a user from the auth provider registry.
	 *
	 * @param user The ID of the suer to add.
	 */
	removeUser(user: UserIdResolvable): void {
		this._registry.delete(extractUserId(user));
	}

	getScopesForUser(user: UserIdResolvable): string[] {
		const userId = extractUserId(user);

		if (!this._registry.has(userId)) {
			throw new UnregisteredUserError(
				userId,
				`User "${userId}" could not be located in the authentication provider registry. Please add the user first by using one of the following methods: addUser, addUserForToken, or addUserForCode`,
			);
		}

		return this._registry.get(userId)!.scopes ?? [];
	}

	async getAccessTokenForUser(user: UserIdResolvable, scopes?: string[]): Promise<AccessTokenWithUserId> {
		const userId = extractUserId(user);

		if (this._newTokenPromises.has(userId)) {
			const token = (await this._newTokenPromises.get(userId))!;
			return { ...token, userId };
		}

		if (!this._registry.has(userId)) {
			throw new UnregisteredUserError(
				userId,
				`User "${userId}" could not be located in the authentication provider registry. Please add the user first by using one of the following methods: addUser, addUserForToken, or addUserForCode.
`,
			);
		}

		const currentToken = this._registry.get(userId)!;

		if (currentToken.accessToken && !isAccessTokenExpired(currentToken)) {
			if (currentToken.scopes) {
				compareScopes(currentToken.scopes, scopes, userId);
			}

			return { ...currentToken, userId };
		}

		const token = await this.refreshAccessTokenForUser(userId);
		token.scopes = currentToken.scopes;

		if (token.scopes) {
			compareScopes(token.scopes, scopes, userId);
		}

		return { ...token, userId };
	}

	async refreshAccessTokenForUser(user: UserIdResolvable): Promise<AccessTokenWithUserId> {
		const userId = extractUserId(user);

		if (!this._registry.has(userId)) {
			throw new UnregisteredUserError(
				userId,
				`User "${userId}" could not be located in the authentication provider registry. Please add the user first by using one of the following methods: addUser, addUserForToken, or addUserForCode.`,
			);
		}

		const currentToken = this._registry.get(userId)!;

		if (!currentToken.refreshToken) {
			throw new InvalidTokenError(
				userId,
				`Unable to refresh access token for user "${userId}". Refresh token is not specified.`,
			);
		}

		const newTokenPromise = refreshAccessToken(
			this._config.clientId,
			this._config.clientSecret,
			currentToken.refreshToken,
		);
		this._newTokenPromises.set(userId, newTokenPromise);

		const token = await newTokenPromise;
		this._newTokenPromises.delete(userId);
		this._registry.set(userId, token);

		this.emit(this.onRefresh, userId, token);

		return { ...token, userId };
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
