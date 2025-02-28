import { DataObject, rawDataSymbol, ReadDocumentation } from '@donation-alerts/common';

/** @internal */
export interface DonationAlertsMerchandiseMerchantData {
	identifier: string;
	name: string;
}

/**
 * Represents merchant information.
 *
 * @remarks
 * This class provides details about a merchant associated with Donation Alerts merchandise.
 * It includes the merchant's unique identifier and display name.
 */
@ReadDocumentation('api')
export class DonationAlertsMerchandiseMerchant extends DataObject<DonationAlertsMerchandiseMerchantData> {
	/**
	 * Unique merchant ID on Donation Alerts.
	 *
	 * @remarks
	 * A unique identifier assigned to the merchant by the Donation Alerts platform.
	 *
	 * @returns The merchant's unique identifier as a string.
	 */
	get identifier(): string {
		return this[rawDataSymbol].identifier;
	}

	/**
	 * Merchant name.
	 *
	 * @remarks
	 * The human-readable name of the merchant as displayed on Donation Alerts.
	 *
	 * @returns The merchant's name as a string.
	 */
	get name(): string {
		return this[rawDataSymbol].name;
	}
}
