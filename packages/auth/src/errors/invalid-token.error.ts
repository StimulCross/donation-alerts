import { CustomError } from '@donation-alerts/common';

/**
 * An error indicating the token is invalid.
 *
 * This may relate to access tokens, refresh tokens, or other token-related data.
 */
export class InvalidTokenError extends CustomError {
	/** @internal */
	constructor(
		private readonly _userId: number | null,
		message: string,
	) {
		super(message);
	}

	/**
	 * The ID of the user associated with the token.
	 *
	 * Returns `null` if the user is unknown.
	 */
	get userId(): number | null {
		return this._userId;
	}
}
