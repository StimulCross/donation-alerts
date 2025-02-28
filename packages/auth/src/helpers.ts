import { callDonationAlertsApi } from '@donation-alerts/api-call';
import { type AccessToken } from './access-token';
import { MissingScopeError } from './errors';

/** @internal */
interface AccessTokenData {
	access_token: string;
	refresh_token: string;
	expires_in: number;
}

function createAccessTokenFromData(data: AccessTokenData): AccessToken {
	return {
		accessToken: data.access_token,
		refreshToken: data.refresh_token,
		expiresIn: data.expires_in,
		obtainmentTimestamp: Date.now(),
	};
}

/**
 * Obtains an access token using client credentials and an authorization code.
 *
 * @remarks
 * When a user authenticates your application, an authorization code is provided.
 * This function exchanges that code for an access token, which can be used to make
 * authorized requests to the Donation Alerts API.
 *
 * @param clientId The client ID of your application.
 * @param clientSecret The client secret of your application.
 * @param redirectUri The redirect URI specified in your application.
 * @param code The authorization code returned after successful user authorization.
 *
 * @returns A promise resolving to an {@link AccessToken} object.
 *
 * @throws {@link HttpError} If an error occurs during the request, such as invalid credentials.
 *
 * @example
 * ```ts
 * try {
 *     const accessToken = await getAccessToken(
 *         'your-client-id',
 *         'your-client-secret',
 *         'http://your-redirect-uri',
 *         'authorization-code'
 *     );
 *
 *     console.log('Access Token:', accessToken.accessToken);
 * } catch (e) {
 *     console.error('Failed to get access token:', e);
 * }
 * ```
 */
export async function getAccessToken(
	clientId: string,
	clientSecret: string,
	redirectUri: string,
	code: string,
): Promise<AccessToken> {
	return createAccessTokenFromData(
		await callDonationAlertsApi<AccessTokenData>({
			type: 'auth',
			url: 'token',
			method: 'GET',
			formBody: {
				grant_type: 'authorization_code',
				client_id: clientId,
				client_secret: clientSecret,
				redirect_uri: redirectUri,
				code,
			},
			auth: false,
		}),
	);
}

/**
 * Refreshes an expired access token using the refresh token.
 *
 * @remarks
 * Access tokens eventually expire, but a refresh token can be used to obtain
 * a new one without requiring user reauthorization. This function performs the
 * necessary call to refresh the token and return a new {@link AccessToken} object.
 *
 * @param clientId The client ID of your application.
 * @param clientSecret The client secret of your application.
 * @param refreshToken The refresh token obtained during the initial authorization process.
 * @param scopes Optional. The scopes to request for the new access token. Defaults to the original scopes.
 *
 * @returns A promise resolving to a new {@link AccessToken} object.
 *
 * @throws {@link HttpError} If an error occurs during the request, such as an invalid refresh token.
 *
 * @example
 * ```ts
 * try {
 *     const token = await refreshAccessToken(
 *         'your-client-id',
 *         'your-client-secret',
 *         'refresh-token-here',
 *         ['oauth-user-show', 'oauth-donation-index']
 *     );
 *
 *     console.log('New Access Token:', token.accessToken);
 * } catch (e) {
 *     console.error('Failed to refresh access token:', e);
 * }
 * ```
 */
export async function refreshAccessToken(
	clientId: string,
	clientSecret: string,
	refreshToken: string,
	scopes: string[] = [],
): Promise<AccessToken> {
	return createAccessTokenFromData(
		await callDonationAlertsApi<AccessTokenData>({
			type: 'auth',
			url: 'token',
			method: 'POST',
			formBody: {
				grant_type: 'refresh_token',
				refresh_token: refreshToken,
				client_id: clientId,
				client_secret: clientSecret,
				scope: scopes,
			},
			auth: false,
		}),
	);
}

/**
 * Compares and verifies the token's scopes against requested scopes.
 *
 * @remarks
 * This function checks if the provided token has all the necessary scopes for an operation.
 * If the token does not contain any of the requested scopes, a {@link MissingScopeError} is thrown
 * for the caller to handle.
 *
 * @param scopesToCompare The list of scopes present in the token.
 * @param requestedScopes The scopes needed for the operation. Default to an empty array.
 * @param userId The user ID associated with the token. This is used in the error message if scopes are missing.
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
export function compareScopes(scopesToCompare: string[], requestedScopes: string[] = [], userId: number): void {
	const scopes = new Set<string>(scopesToCompare);
	const missingScopes: string[] = [];

	for (const scope of requestedScopes) {
		if (!scopes.has(scope)) {
			missingScopes.push(scope);
		}
	}

	if (missingScopes.length > 0) {
		throw new MissingScopeError(
			userId,
			missingScopes,
			`The token does not have the requested scopes: ${requestedScopes.join(', ')}`,
		);
	}
}
