import { callDonationAlertsApi } from '@donation-alerts/api-call';
import { type AccessToken } from '../interfaces/access-token.js';

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
 * Calculates the expiration time of the access token in milliseconds since UNIX epoch.
 *
 * @remarks
 * This function computes the approximate time when the token will expire by adding
 * the `expiresIn` value (in seconds) to the `obtainmentTimestamp`.
 *
 * @param token The access token whose expiration time should be calculated.
 *
 * @returns The expiration time in milliseconds since UNIX epoch.
 */
export function getExpiryMilliseconds(token: AccessToken): number {
	return token.obtainmentTimestamp + token.expiresIn * 1000;
}

/**
 * Calculates the expiration date of the access token as a `Date` object.
 *
 * @param token The access token whose expiration date should be calculated.
 *
 * @returns A `Date` object representing the token expiration date.
 */
export function getTokenExpiryDate(token: AccessToken): Date {
	return new Date(getExpiryMilliseconds(token));
}

/**
 * Checks whether the given access token is expired.
 *
 * @remarks
 * To handle potential latency issues between the API and the client,
 * this function applies a one-minute grace period when determining expiry.
 *
 * @param token The access token to evaluate.
 *
 * @returns A boolean indicating whether the token has expired (`true`) or not (`false`).
 */
export function isAccessTokenExpired(token: AccessToken): boolean {
	return Date.now() >= getExpiryMilliseconds(token);
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
