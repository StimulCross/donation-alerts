import { extractUserId, ReadDocumentation, type UserIdResolvable } from '@donation-alerts/common';
import { nonenumerable } from '@stimulcross/shared-utils';
import { type AuthProvider } from './AuthProvider';
import { BaseAuthProvider } from './BaseAuthProvider';
import { isAccessTokenExpired, type AccessToken } from '../AccessToken';
import { type AuthUser } from '../AuthUser';
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

	/**
	 * A function that is called when the token is refreshed.
	 *
	 * @param userId The Donation Alerts user ID the access token refreshed of.
	 * @param token The refreshed {@link AccessToken} data.
	 */
	onRefresh?: (userId: number, token: AccessToken) => void;
}

/**
 * An authentication provider implementation that uses user refresh tokens to automatically refresh the access token
 * whenever necessary.
 */
@ReadDocumentation('events')
export class RefreshingAuthProvider extends BaseAuthProvider implements AuthProvider {
	@nonenumerable private readonly _clientSecret: string;
	private readonly _onRefresh?: (userId: number, token: AccessToken) => void;

	@nonenumerable private readonly _newTokenPromises = new Map<number, Promise<AccessToken>>();

	/**
	 * Creates a new auth provider based on the given one that can automatically refresh access tokens.
	 *
	 * @param config The information necessary to automatically refresh an access token.
	 * @param users The initial users to register on instance creation.
	 */
	constructor(config: RefreshingAuthProviderConfig, users: AuthUser[] = []) {
		super(config.clientId, users);

		this._clientSecret = config.clientSecret;
		this._onRefresh = config.onRefresh;
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

		const newTokenPromise = refreshAccessToken(this._clientId, this._clientSecret, currentToken.refreshToken);
		this._newTokenPromises.set(userId, newTokenPromise);

		const token = await newTokenPromise;
		this._newTokenPromises.delete(userId);
		this._registry.set(userId, token);

		this._onRefresh?.(userId, token);

		return token;
	}

	protected async _doGetAccessToken(user: UserIdResolvable, scopes?: string[]): Promise<AccessToken> {
		const userId = extractUserId(user);

		if (this._newTokenPromises.has(userId)) {
			return (await this._newTokenPromises.get(userId))!;
		}

		if (this._registry.has(userId)) {
			const token = this._registry.get(userId)!;
			const existingScopes = token.scope;

			if (token.accessToken && !isAccessTokenExpired(token)) {
				if (token.scope) {
					compareScopes(token.scope, scopes);
				}

				return token;
			}

			const newToken = await this.refreshAccessTokenForUser(userId);
			newToken.scope = existingScopes;

			if (newToken.scope) {
				compareScopes(newToken.scope, scopes);
			}

			return newToken;
		}

		throw new UnregisteredUserError(
			`User ${userId} not found in the auth provider registry. Use {RefreshingAuthProvider#addUser} method to add the user first.`
		);
	}
}
