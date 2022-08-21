import { klona } from 'klona';
import { nonenumerable } from '@stimulcross/shared-utils';

/** @internal */
export const rawDataSymbol: unique symbol = Symbol('donationAlertsRawData');

/**
 * Returns the raw data of the data object.
 *
 * @param data The data object to get the raw data of.
 */
export function getRawData<T>(data: DataObject<T>): T {
	return klona(data[rawDataSymbol]);
}

/** @internal */
export abstract class DataObject<T> {
	/** @internal */
	@nonenumerable readonly [rawDataSymbol]: T;

	/** @internal */
	constructor(data: T) {
		this[rawDataSymbol] = data;
	}
}
