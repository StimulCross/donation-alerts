import { isNil } from './is-nil.js';

/** @internal */
export function mapNullable<I, O>(value: I | null | undefined, fn: (value: I) => O): O | null {
	return isNil(value) ? null : fn(value);
}
