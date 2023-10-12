import { callDonationAlertsApi, HttpError } from '@donation-alerts/api-call';
import { extractUserId, ReadDocumentation, type UserIdResolvable } from '@donation-alerts/common';
import { nonenumerable } from '@stimulcross/shared-utils';
import { EventEmitter } from 'typed-event-emitter';
import { type AuthProvider } from './AuthProvider';
import { type AccessToken, isAccessTokenExpired } from '../AccessToken';
import { InvalidTokenError, MissingScopeError, UnregisteredUserError } from '../errors';
import { compareScopes, exchangeCode, refreshAccessToken } from '../helpers';

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
	addUser(user: UserIdResolvable, token: AccessToken): void {
		this._validateToken(token);
		this._compareScopes(token);

		this._registry.set(extractUserId(user), token);
	}

	/**
	 * Finds out the user associated to the given access token and adds them to the provider.
	 *
	 * If you already know the ID of the user you are adding,
	 * consider using {@link RefreshingAuthProvider#addUser} instead.
	 *
	 * @param token The initial token data.
	 */
	async addUserForToken(token: AccessToken): Promise<void> {
		this._validateToken(token);

		let accessToken = token;
		let isTokenRefreshed = false;
		let userId: number;

		if (accessToken.scopes) {
			compareScopes(accessToken.scopes, this._config.scopes);
		}

		if (!isAccessTokenExpired(accessToken)) {
			accessToken = await refreshAccessToken(
				this._config.clientId,
				this._config.clientSecret,
				accessToken.refreshToken!,
				this._config.scopes
			);
			isTokenRefreshed = true;
		}

		try {
			const user = await callDonationAlertsApi<{ data: { id: number } }>(
				{ type: 'api', url: 'user/oauth' },
				accessToken.accessToken
			);

			userId = user.data.id;
		} catch (e) {
			if (e instanceof HttpError && e.statusCode === 401) {
				throw new MissingScopeError(
					`Failed to query the user associated with the token.
Received 401 error: "${e.message}".
The access token must include "oauth-user-show" scope to query the user associated with the token.`
				);
			}

			throw e;
		}

		this.addUser(userId, accessToken);

		if (isTokenRefreshed) {
			this.emit(this.onRefresh, userId, accessToken);
		}
	}

	/**
	 * Exchanges an authorization code for an access token and adds the user to the provider.
	 *
	 * @param code The authorization code.
	 */
	async addUserForCode(code: string): Promise<void> {
		if (!this._config.redirectUri) {
			throw new Error('Exchanging authorization code requires "redirectUri" option to be specified');
		}

		const token = await exchangeCode(
			this._config.clientId,
			this._config.clientSecret,
			this._config.redirectUri,
			code
		);

		const user = await callDonationAlertsApi<{ data: { id: number } }>(
			{ type: 'api', url: 'user/oauth' },
			token.accessToken
		);

		this.addUser(user.data.id, token);
		this.emit(this.onRefresh, user.data.id, token);
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
				`User ${userId} not found in the auth provider registry. Use {StaticAuthProvider#addUser} method to add the user first.`
			);
		}

		return this._registry.get(userId)!.scopes ?? [];
	}

	async getAccessTokenForUser(user: UserIdResolvable, scopes?: string[]): Promise<AccessToken> {
		const userId = extractUserId(user);

		if (this._newTokenPromises.has(userId)) {
			return (await this._newTokenPromises.get(userId))!;
		}

		if (!this._registry.has(userId)) {
			throw new UnregisteredUserError(
				`User ${userId} not found in the auth provider registry. Use {RefreshingAuthProvider#addUser} method to add the user first.`
			);
		}

		const currentToken = this._registry.get(userId)!;

		if (currentToken.accessToken && !isAccessTokenExpired(currentToken)) {
			if (currentToken.scopes) {
				compareScopes(currentToken.scopes, scopes);
			}

			return currentToken;
		}

		const token = await this.refreshAccessTokenForUser(userId);
		token.scopes = currentToken.scopes;

		if (token.scopes) {
			compareScopes(token.scopes, scopes);
		}

		return token;
	}

	async refreshAccessTokenForUser(user: UserIdResolvable): Promise<AccessToken> {
		const userId = extractUserId(user);

		if (!this._registry.has(userId)) {
			throw new UnregisteredUserError(
				`User ${userId} not found in the auth provider registry. Use {RefreshingAuthProvider#addUser} method to add the user first.`
			);
		}

		const currentToken = this._registry.get(userId)!;

		if (!currentToken.refreshToken) {
			throw new InvalidTokenError(`Unable to refresh access token for user ${userId}. Refresh token is not set`);
		}

		const newTokenPromise = refreshAccessToken(
			this._config.clientId,
			this._config.clientSecret,
			currentToken.refreshToken
		);
		this._newTokenPromises.set(userId, newTokenPromise);

		const token = await newTokenPromise;
		this._newTokenPromises.delete(userId);
		this._registry.set(userId, token);

		this.emit(this.onRefresh, userId, token);

		return token;
	}

	private _validateToken(token: AccessToken): void {
		if (!token.accessToken) {
			throw new InvalidTokenError("The access token is invalid. Make sure it's a non-empty string");
		}

		if (!token.refreshToken) {
			throw new InvalidTokenError("The refresh token is invalid. Make sure it's a non-empty string");
		}
	}

	private _compareScopes(token: AccessToken): void {
		if (token.scopes) {
			compareScopes(token.scopes, this._config.scopes);
		}
	}
}
