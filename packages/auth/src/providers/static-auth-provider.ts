import { extractUserId, ReadDocumentation, type UserIdResolvable } from '@donation-alerts/common';
import { nonenumerable } from '@stimulcross/shared-utils';
import { type AuthProvider } from './auth-provider';
import { type AccessToken, type AccessTokenWithUserId } from '../access-token';
import { InvalidTokenError, UnregisteredUserError } from '../errors';
import { compareScopes } from '../helpers';

/**
 * A non-refreshable (static) authentication provider that always returns
 * the initially provided credentials.
 */
@ReadDocumentation('events')
export class StaticAuthProvider implements AuthProvider {
	@nonenumerable private readonly _clientId: string;
	@nonenumerable private readonly _scopes?: string[];
	@nonenumerable private readonly _registry = new Map<number, AccessToken>();

	/**
	 * Creates a new instance of StaticAuthProvider.
	 *
	 * @param clientId The client ID associated with your application.
	 * @param scopes An optional list of required scopes to validate against.
	 */
	constructor(clientId: string, scopes?: string[]) {
		this._clientId = clientId;
		this._scopes = scopes;
	}

	get clientId(): string {
		return this._clientId;
	}

	/**
	 * Checks if the specified user is already registered in this auth provider.
	 *
	 * @param user The ID of the user to look for.
	 * @returns A boolean indicating whether the user is registered.
	 */
	hasUser(user: UserIdResolvable): boolean {
		return this._registry.has(extractUserId(user));
	}

	/**
	 * Adds a user and their related token data to this auth provider.
	 *
	 * @param user The ID of the user.
	 * @param accessToken The access token.
	 * @param scopes An optional list of scopes associated with the access token.
	 * These scopes will be compared against the scopes specified in the constructor.
	 * the scopes specified in the constructor (if any).
	 *
	 * @throws {@link InvalidTokenError} if the access token is empty or undefined.
	 * @throws {@link MissingScopeError} if the token scopes miss required scopes.
	 */
	addUser(user: UserIdResolvable, accessToken: string, scopes?: string[]): void {
		const userId = extractUserId(user);

		if (!accessToken) {
			throw new InvalidTokenError(
				userId,
				`The access token of user "${userId}" is invalid. Make sure it's a non-empty string.`,
			);
		}

		if (scopes) {
			compareScopes(scopes, this._scopes, userId);
		}

		this._registry.set(userId, {
			accessToken,
			refreshToken: '',
			expiresIn: 0,
			obtainmentTimestamp: Date.now(),
			scopes,
		});
	}

	/**
	 * Removes an existing user from this auth provider.
	 *
	 * @param user The ID of the user to remove.
	 */
	removeUser(user: UserIdResolvable): void {
		this._registry.delete(extractUserId(user));
	}

	getScopesForUser(user: UserIdResolvable): string[] {
		const userId = extractUserId(user);

		if (!this._registry.has(userId)) {
			throw new UnregisteredUserError(
				userId,
				`User "${userId}" could not be located in the authentication provider registry. Please add the user first by using addUser method.`,
			);
		}

		return this._registry.get(userId)!.scopes ?? [];
	}

	async getAccessTokenForUser(user: UserIdResolvable, scopes?: string[]): Promise<AccessTokenWithUserId> {
		const userId = extractUserId(user);

		if (!this._registry.has(userId)) {
			throw new UnregisteredUserError(
				userId,
				`User "${userId}" could not be located in the authentication provider registry. Please add the user first by using addUser method.`,
			);
		}

		const token = this._registry.get(userId)!;

		if (!token.accessToken) {
			throw new InvalidTokenError(
				userId,
				`The access token of user "${userId}" is invalid. Make sure it's a non-empty string.`,
			);
		}

		if (token.scopes) {
			compareScopes(token.scopes, scopes, userId);
		}

		return { ...token, userId };
	}
}
