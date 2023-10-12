import { extractUserId, ReadDocumentation, type UserIdResolvable } from '@donation-alerts/common';
import { nonenumerable } from '@stimulcross/shared-utils';
import { EventEmitter } from 'typed-event-emitter';
import { type AuthProvider } from './AuthProvider';
import { type AccessToken, isAccessTokenExpired } from '../AccessToken';
import { InvalidTokenError, UnregisteredUserError } from '../errors';
import { compareScopes, refreshAccessToken } from '../helpers';

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
	 * Adds a user to the auth provider registry.
	 *
	 * @param user The ID of the user.
	 * @param token The initial token data.
	 */
	addUser(user: UserIdResolvable, token: AccessToken): void {
		this._registry.set(extractUserId(user), token);
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

		return this._registry.get(userId)!.scope ?? [];
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
		const existingScopes = currentToken.scope;

		if (currentToken.accessToken && !isAccessTokenExpired(currentToken)) {
			if (currentToken.scope) {
				compareScopes(currentToken.scope, scopes);
			}

			return currentToken;
		}

		const token = await this.refreshAccessTokenForUser(userId);
		token.scope = existingScopes;

		if (token.scope) {
			compareScopes(token.scope, scopes);
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
}
