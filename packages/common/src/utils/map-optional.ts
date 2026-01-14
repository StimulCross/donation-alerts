import { isNil } from './is-nil.js';

/** @internal */
export function mapOptional<I, O>(value: I | null | undefined, fn: (value: I) => O): O | undefined {
	return isNil(value) ? undefined : fn(value);
}
