import { mapNullable } from '@stimulcross/shared-utils';

/**
 * Represents the data of an OAuth access token returned by Donation Alerts.
 */
export interface AccessToken {
	/**
	 * The access token which is necessary for every request to the Donation Alerts API.
	 */
	accessToken: string;

	/**
	 * The refresh token which is necessary to refresh the access token once it expires.
	 */
	refreshToken: string | null;

	/**
	 * The scope the access token is valid for, i.e. what the token enables you to do.
	 */
	scopes?: string[];

	/**
	 * The time, in seconds from the obtainment date, when the access token expires.
	 */
	expiresIn: number | null;

	/**
	 * The date when the token was obtained, in epoch milliseconds.
	 */
	obtainmentTimestamp: number;
}

/**
 * Calculates milliseconds since UNIX epoch when the access token will expire.
 *
 * @param token The access token.
 */
export function getExpiryMilliseconds(token: AccessToken): number | null {
	return mapNullable(token.expiresIn, val => token.obtainmentTimestamp + val * 1000);
}

/**
 * Calculates the date when the access token will expire.
 *
 * @param token The access token.
 */
export function getTokenExpiryDate(token: AccessToken): Date | null {
	return mapNullable(getExpiryMilliseconds(token), val => new Date(val));
}

/**
 * Checks whether the given access token is expired.
 *
 * A one-minute grace period is applied for smooth handling of API latency.
 *
 * @param token The access token.
 */
export function isAccessTokenExpired(token: AccessToken): boolean {
	return mapNullable(getExpiryMilliseconds(token), val => Date.now() >= val) ?? false;
}
