import { sha256 } from 'cross-sha256';
import { flattenObject } from '@stimulcross/shared-utils';

export function createSha256SignatureFromParams(params: Record<PropertyKey, unknown>, secret: string): string {
	const valuesString = Object.values(flattenObject(params))
		.filter(v => v !== undefined)
		.map(e => String(e))
		.sort()
		.join('');

	return new sha256().update(valuesString + secret).digest('hex');
}
