import type { UserIdResolvable } from '@donation-alerts/common';
import { extractUserId, ReadDocumentation } from '@donation-alerts/common';
import type { AuthUser } from '../AuthUser';
import type { AccessToken } from '../AccessToken';
import { compareScopes } from '../helpers';
import { UnregisteredUserError } from '../errors/UnregisteredUserError';
import type { StaticAuthUser } from '../StaticAuthUser';
import type { AuthProvider } from './AuthProvider';
import { BaseAuthProvider } from './BaseAuthProvider';

/**
 * Static non-self-refreshing authentication provider, that always returns the same initially given credentials.
 */
@ReadDocumentation('events')
export class StaticAuthProvider extends BaseAuthProvider implements AuthProvider {
	constructor(clientId: string, users: StaticAuthUser[] = []) {
		super(
			clientId,
			users.map((user: StaticAuthUser): AuthUser => {
				return {
					user: extractUserId(user.user),
					accessToken: {
						accessToken: user.accessToken.accessToken,
						refreshToken: user.accessToken.refreshToken ?? '',
						expiresIn: user.accessToken.expiresIn ?? 0,
						obtainmentTimestamp: user.accessToken.obtainmentTimestamp ?? 0,
						scope: user.accessToken.scope
					}
				};
			})
		);
	}

	protected async _doGetAccessToken(user: UserIdResolvable, scopes?: string[]): Promise<AccessToken> {
		const userId = extractUserId(user);

		if (this._registry.has(userId)) {
			const token = this._registry.get(userId)!;

			if (token.accessToken) {
				if (token.scope) {
					compareScopes(token.scope, scopes);
				}

				return token;
			}

			throw new Error(`No token found for user ${userId}`);
		} else {
			throw new UnregisteredUserError(
				`User ${userId} not found in the auth provider registry. Use {StaticAuthProvider#addUser} method to add the user first.`
			);
		}
	}
}
