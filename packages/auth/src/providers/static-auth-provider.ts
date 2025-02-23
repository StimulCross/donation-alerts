import { extractUserId, ReadDocumentation, type UserIdResolvable } from '@donation-alerts/common';
import { nonenumerable } from '@stimulcross/shared-utils';
import { type AuthProvider } from './auth-provider';
import { type AccessToken, type AccessTokenWithUserId } from '../access-token';
import { InvalidTokenError, UnregisteredUserError } from '../errors';
import { compareScopes } from '../helpers';

/**
 * Static non-self-refreshing authentication provider, that always returns the same initially given credentials.
 */
@ReadDocumentation('events')
export class StaticAuthProvider implements AuthProvider {
	@nonenumerable private readonly _clientId: string;
	@nonenumerable private readonly _scopes?: string[];
	@nonenumerable private readonly _registry = new Map<number, AccessToken>();

	constructor(clientId: string, scopes?: string[]) {
		this._clientId = clientId;
		this._scopes = scopes;
	}

	get clientId(): string {
		return this._clientId;
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
	addUser(user: UserIdResolvable, token: Pick<AccessToken, 'accessToken' | 'scopes'>): void {
		this._validateAccessToken(token);
		this._compareScopes(token);

		this._registry.set(extractUserId(user), {
			accessToken: token.accessToken,
			refreshToken: null,
			expiresIn: null,
			obtainmentTimestamp: Date.now(),
			scopes: token.scopes,
		});
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
				`User ${userId} not found in the auth provider registry. Use {StaticAuthProvider#addUser} method to add the user first.`,
			);
		}

		return this._registry.get(userId)!.scopes ?? [];
	}

	async getAccessTokenForUser(user: UserIdResolvable, scopes?: string[]): Promise<AccessTokenWithUserId> {
		const userId = extractUserId(user);

		if (!this._registry.has(userId)) {
			throw new UnregisteredUserError(
				`User ${userId} not found in the auth provider registry. Use {StaticAuthProvider#addUser} method to add the user first.`,
			);
		}

		const token = this._registry.get(userId)!;

		if (!token.accessToken) {
			throw new Error(`No token found for user ${userId}`);
		}

		if (token.scopes) {
			compareScopes(token.scopes, scopes);
		}

		return { ...token, userId };
	}

	private _validateAccessToken(token: Pick<AccessToken, 'accessToken' | 'scopes'>): void {
		if (!token.accessToken) {
			throw new InvalidTokenError("The access token is invalid. Make sure it's a non-empty string");
		}
	}

	private _compareScopes(token: Pick<AccessToken, 'accessToken' | 'scopes'>): void {
		if (token.scopes) {
			compareScopes(token.scopes, this._scopes);
		}
	}
}
