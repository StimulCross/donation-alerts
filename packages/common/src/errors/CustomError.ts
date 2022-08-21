/** @internal */
export class CustomError extends Error {
	constructor(message: string) {
		super(message);

		// restore prototype chain
		Object.setPrototypeOf(this, new.target.prototype);

		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		Error.captureStackTrace?.(this, new.target.constructor);
	}

	get name(): string {
		return this.constructor.name;
	}
}
