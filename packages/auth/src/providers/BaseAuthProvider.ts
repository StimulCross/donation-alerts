import { extractUserId, type UserIdResolvable } from '@donation-alerts/common';
import { nonenumerable } from '@stimulcross/shared-utils';
import { type AuthProvider } from './AuthProvider';
import { type AccessToken } from '../AccessToken';
import { type AuthUser } from '../AuthUser';
import { UnregisteredUserError } from '../errors/UnregisteredUserError';

/** @internal */
export abstract class BaseAuthProvider implements AuthProvider {
	@nonenumerable protected readonly _clientId: string;
	@nonenumerable protected readonly _registry = new Map<number, AccessToken>();

	protected constructor(clientId: string, users: AuthUser[] = []) {
		this._clientId = clientId;
		users.forEach(user => this._registry.set(extractUserId(user.user), user.accessToken));
	}

	get clientId(): string {
		return this._clientId;
	}

	addUser(user: UserIdResolvable, accessToken: AccessToken): void {
		this._registry.set(extractUserId(user), accessToken);
	}

	removeUser(user: UserIdResolvable): void {
		this._registry.delete(extractUserId(user));
	}

	getScopesForUser(user: UserIdResolvable): string[] {
		const userId = extractUserId(user);

		if (this._registry.has(userId)) {
			return this._registry.get(userId)!.scope ?? [];
		}

		throw new UnregisteredUserError(
			`User ${userId} not found in the auth provider registry. Use {RefreshingAuthProvider#addUser} method to add the user first.`
		);
	}

	async getAccessTokenForUser(user: UserIdResolvable, scopes?: string[]): Promise<AccessToken> {
		return await this._doGetAccessToken(user, scopes);
	}

	protected abstract _doGetAccessToken(user: UserIdResolvable, scopes?: string[]): Promise<AccessToken>;
}
