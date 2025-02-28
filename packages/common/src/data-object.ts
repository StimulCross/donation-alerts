import { nonenumerable } from '@stimulcross/shared-utils';
import { klona } from 'klona';

/** @internal */
export const rawDataSymbol: unique symbol = Symbol('donationAlertsRawData');

/**
 * Retrieves a deep clone of the raw data of the given `DataObject` instance.
 *
 * @param data The `DataObject` instance from which to obtain the raw data.
 *
 * @returns A deep-cloned copy of the raw data stored within the given data object.
 *
 * @example
 * ```ts
 * const rawData = getRawData(myDataObject);
 * console.log(rawData); // Logs the raw data
 * ```
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
