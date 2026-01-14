/**
 * Represents the data of an OAuth access token returned by Donation Alerts.
 */
export interface AccessToken {
	/**
	 * The access token, required for all authenticated requests to the Donation Alerts API.
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
	 * The timestamp, in milliseconds since UNIX epoch, when the token was obtained.
	 */
	readonly obtainmentTimestamp: number;

	/**
	 * An optional list of scopes that this access token is valid for.
	 *
	 * @remarks
	 * - It is **highly recommended** to set the valid scopes for tokens to enable the library to verify
	 *   your tokens against required scopes.
	 *
	 * - With proper configuration, if you attempt to register an access token in an auth provider without
	 * the required scope, or make an API request to an endpoint that requires a scope the token does not have,
	 * a {@link MissingScopeError} will be thrown.
	 *
	 * - This error allows you to handle such scenarios properly, for example, by prompting the user
	 * to reauthorize your application with the necessary permissions.
	 *
	 * - The Donation Alerts API does not provide a way to validate the actual set of
	 * scopes associated with an access token. As a result, you must take responsibility for storing
	 * and managing tokens and their scopes.
	 *
	 * - Save the scopes alongside the access tokens in your application's persistent storage. This ensures
	 * that scope management for your access tokens is accurate and reliable.
	 */
	scopes?: string[];
}

/**
 * Represents the data of an OAuth access token with an associated user ID.
 */
export interface AccessTokenWithUserId extends AccessToken {
	/**
	 * The ID of the user associated with this access token.
	 */
	readonly userId: number;
}
