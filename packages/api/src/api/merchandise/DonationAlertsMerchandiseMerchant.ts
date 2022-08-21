import { DataObject, rawDataSymbol, ReadDocumentation } from '@donation-alerts/common';

/** @internal */
export interface DonationAlertsMerchandiseMerchantData {
	identifier: string;
	name: string;
}

/**
 * Represents merchant information.
 */
@ReadDocumentation('api')
export class DonationAlertsMerchandiseMerchant extends DataObject<DonationAlertsMerchandiseMerchantData> {
	/**
	 * Unique merchant ID on DonationAlerts.
	 */
	get identifier(): string {
		return this[rawDataSymbol].identifier;
	}

	/**
	 * Merchant name.
	 */
	get name(): string {
		return this[rawDataSymbol].name;
	}
}
