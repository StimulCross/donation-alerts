/** @internal */
export interface PromiseWithResolvers<T = void> {
	promise: Promise<T>;
	resolve: (value: T | PromiseLike<T>) => void;
	reject: (reason?: unknown) => void;
}

/** @internal */
export function promiseWithResolvers<T = void>(): PromiseWithResolvers<T> {
	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, node/no-unsupported-features/es-syntax
	if (Promise.withResolvers) {
		// eslint-disable-next-line node/no-unsupported-features/es-syntax
		return Promise.withResolvers<T>();
	}

	let resolve!: (value: T | PromiseLike<T>) => void;
	let reject!: (reason: unknown) => void;
	const promise = new Promise<T>((_resolve, _reject) => {
		resolve = _resolve;
		reject = _reject;
	});

	return { promise, resolve, reject };
}
