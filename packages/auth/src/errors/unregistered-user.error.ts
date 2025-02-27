import { CustomError } from '@donation-alerts/common';

/**
 * An error indicating that a managed user is not registered in the authentication provider.
 */
export class UnregisteredUserError extends CustomError {
	/** @internal */
	constructor(
		private readonly _userId: number,
		message: string,
	) {
		super(message);
	}

	/**
	 * The ID of the unregistered user.
	 */
	get userId(): number {
		return this._userId;
	}
}
