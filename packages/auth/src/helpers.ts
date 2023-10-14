import { callDonationAlertsApi } from '@donation-alerts/api-call';
import { type AccessToken } from './AccessToken';
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
		obtainmentTimestamp: Date.now()
	};
}

/**
 * Gets an access token with your client credentials and an authorization code.
 *
 * @param clientId The client ID of the application.
 * @param clientSecret The client secret of the application.
 * @param redirectUri The redirect URI.
 * @param code The authorization code.
 */
export async function exchangeCode(
	clientId: string,
	clientSecret: string,
	redirectUri: string,
	code: string
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
				code
			},
			auth: false
		})
	);
}

/**
 * Refreshes an expired access token with your client credentials and the refresh token that was given by the initial authentication.
 *
 * @param clientId The client ID of your application.
 * @param clientSecret The client secret of your application.
 * @param refreshToken The refresh token.
 * @param scopes The token scopes.
 */
export async function refreshAccessToken(
	clientId: string,
	clientSecret: string,
	refreshToken: string,
	scopes: string[] = []
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
				scope: scopes
			},
			auth: false
		})
	);
}

/**
 * Compares scopes for a non-upgradable `AuthProviderOld` instance.
 *
 * @param scopesToCompare The scopes to compare against.
 * @param requestedScopes The scopes you requested.
 */
export function compareScopes(scopesToCompare: string[], requestedScopes?: string[]): void {
	if (requestedScopes) {
		const scopes = new Set<string>(scopesToCompare);

		if (requestedScopes.some(scope => !scopes.has(scope))) {
			throw new MissingScopeError(`The token does not have the requested scopes: ${requestedScopes.join(', ')}`);
		}
	}
}
