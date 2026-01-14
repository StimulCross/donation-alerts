import { extractUserId, type UserIdResolvable } from '@donation-alerts/common';
import { MissingScopeError } from '../errors/missing-scope.error.js';

/**
 * Compares scopes in an access token against a list of requested scopes.
 *
 * @remarks
 * This function checks if the provided token has all the necessary scopes for an operation.
 * If the token does not contain any of the requested scopes, a {@link MissingScopeError} is thrown
 * for the caller to handle.
 *
 * @param scopesToCompare The list of scopes present in the token.
 * @param requestedScopes The scopes needed for the operation. Default to an empty array.
 * @param user The user ID associated with the token. This is used in the error message if scopes are missing.
 *
 * @throws {@link MissingScopeError} If the token does not include the required scopes.
 *
 * @example
 * ```ts
 * try {
 *     compareScopes(['oauth-user-show', 'oauth-donation-index'], ['oauth-custom_alert-store'], 12345);
 * } catch (error) {
 *     if (error instanceof MissingScopeError) {
 *         console.error('Missing scopes:', error.missingScopes);
 *     }
 * }
 * ```
 */
export function compareScopes(
	scopesToCompare: string[],
	requestedScopes: string[] = [],
	user?: UserIdResolvable,
): void {
	const scopes = new Set<string>(scopesToCompare);
	const missingScopes: string[] = [];

	for (const scope of requestedScopes) {
		if (!scopes.has(scope)) {
			missingScopes.push(scope);
		}
	}

	if (missingScopes.length > 0) {
		throw new MissingScopeError(
			user ? extractUserId(user) : null,
			missingScopes,
			`The token does not have the requested scopes: ${requestedScopes.join(', ')}`,
		);
	}
}
