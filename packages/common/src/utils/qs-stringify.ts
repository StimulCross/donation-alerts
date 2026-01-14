import { stringify } from 'qs';

/** @internal */
export function qsStringify(obj: object | undefined, addQueryPrefix?: boolean): string {
	return stringify(obj, { addQueryPrefix, arrayFormat: 'repeat' });
}
