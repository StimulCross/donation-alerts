import { CustomError } from '@donation-alerts/common';

/**
 * An error indicating that a token does not include the requested scope.
 */
export class MissingScopeError extends CustomError {
	/** @internal */
	constructor(
		private readonly _userId: number,
		private readonly _scopes: string[],
		message: string,
	) {
		super(message);
	}

	/**
	 * The ID of the user associated with the token.
	 */
	get userId(): number {
		return this._userId;
	}

	/**
	 * The list of missing scopes.
	 */
	get scopes(): string[] {
		return this._scopes;
	}
}
