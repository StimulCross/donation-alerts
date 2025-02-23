/** @internal */
export class CustomError extends Error {
	constructor(message: string) {
		super(message);

		// restore prototype chain
		Reflect.setPrototypeOf(this, new.target.prototype);
		Error.captureStackTrace?.(this, new.target.constructor);
	}

	get name(): string {
		return this.constructor.name;
	}
}
