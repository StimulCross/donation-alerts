/**
 * Represents the data of an OAuth access token returned by Donation Alerts.
 */
export interface AccessToken {
	/**
	 * The access token which is necessary for every request to the Donation Alerts API.
	 */
	readonly accessToken: string;

	/**
	 * The refresh token used to obtain a new access token when the current one expires.
	 */
	readonly refreshToken: string;

	/**
	 * The time remaining, in seconds from the obtainment timestamp, until the access token expires.
	 */
	readonly expiresIn: number;

	/**
	 * The date when the token was obtained, in epoch milliseconds.
	 */
	readonly obtainmentTimestamp: number;

	/**
	 * The scope the access token is valid for, i.e. what the token enables you to do.
	 */
	scopes?: string[];
}

/**
 * Represents the data of an OAuth access token returned by Donation Alerts with user ID.
 */
export interface AccessTokenWithUserId extends AccessToken {
	readonly userId: number;
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
