import { sha256 } from 'cross-sha256';
import { flattenValues } from './flatten-values.js';

/** @internal */
export function createSha256SignatureFromParams(params: Record<PropertyKey, unknown>, secret: string): string {
	const sortedValuesString = Object.values(flattenValues(params))
		.filter(v => v !== undefined)
		.map(String)
		.toSorted()
		.join('');

	return new sha256().update(sortedValuesString + secret).digest('hex');
}
