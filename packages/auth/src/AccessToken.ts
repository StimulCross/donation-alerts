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
	refreshToken: string;

	/**
	 * The scope the access token is valid for, i.e. what the token enables you to do.
	 */
	scope?: string[];

	/**
	 * The time, in seconds from the obtainment date, when the access token expires.
	 */
	expiresIn: number;

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
export function getExpiryMilliseconds(token: AccessToken): number {
	return token.obtainmentTimestamp + token.expiresIn * 1000;
}

/**
 * Calculates the date when the access token will expire.
 *
 * @param token The access token.
 */
export function getTokenExpiryDate(token: AccessToken): Date {
	return new Date(getExpiryMilliseconds(token));
}

/**
 * Checks whether the given access token is expired.
 *
 * A one-minute grace period is applied for smooth handling of API latency.
 *
 * @param token The access token.
 */
export function isAccessTokenExpired(token: AccessToken): boolean {
	return Date.now() >= getExpiryMilliseconds(token);
}
