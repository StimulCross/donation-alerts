import { mapNullable } from '@stimulcross/shared-utils';
import type { DonationAlertsOutputCurrency } from '@donation-alerts/common';
import { DataObject, rawDataSymbol, ReadDocumentation } from '@donation-alerts/common';

/**
 * The type of the generated alert.
 */
// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
export type DonationAlertsMerchandiseSaleAlertType = 'merchandise-sale' | string;

/** @internal */
export interface DonationAlertsMerchandiseSaleData {
	id: number;
	name: DonationAlertsMerchandiseSaleAlertType;
	external_id: string;
	username: string | null;
	message: string | null;
	amount: number;
	currency: DonationAlertsOutputCurrency;
	bought_amount: number;
	created_at: string;
	is_shown: 0 | 1;
	shown_at: string | null;
}

/**
 * Represents Donation Alerts merchandise sale alert.
 */
@ReadDocumentation('api')
export class DonationAlertsMerchandiseSale extends DataObject<DonationAlertsMerchandiseSaleData> {
	/**
	 * The unique merchandise sale alert identifier.
	 */
	get id(): number {
		return this[rawDataSymbol].id;
	}

	/**
	 * Type of the generated alert.
	 */
	get name(): DonationAlertsMerchandiseSaleAlertType | string {
		return this[rawDataSymbol].name;
	}

	/**
	 * Unique sale ID generated by the developer.
	 */
	get externalId(): string {
		return this[rawDataSymbol].external_id;
	}

	/**
	 * The name of the customer. Or `null` if customer is unknown.
	 */
	get username(): string | null {
		return this[rawDataSymbol].username;
	}

	/**
	 * The message sent by the customer while purchasing the merchandise. Or `null` if text was not provided.
	 */
	get message(): string | null {
		return this[rawDataSymbol].message;
	}

	/**
	 * Grand total amount of the sale.
	 */
	get amount(): number {
		return this[rawDataSymbol].amount;
	}

	/**
	 * The currency code of the merchandise sale (ISO 4217 formatted).
	 */
	get currency(): DonationAlertsOutputCurrency {
		return this[rawDataSymbol].currency;
	}

	/**
	 * Total number of bought items.
	 */
	get boughtAmount(): number {
		return this[rawDataSymbol].bought_amount;
	}

	/**
	 * Whether the alert was shown in the streamer's widget.
	 */
	get isShown(): boolean {
		return this[rawDataSymbol].is_shown === 1;
	}

	/**
	 * The date and time when sale alert was created.
	 */
	get creationDate(): Date {
		return new Date(this[rawDataSymbol].created_at);
	}

	/**
	 * Date and time indicating when the alert was shown. Or `null` if the alert is not shown yet.
	 */
	get showDate(): Date | null {
		return mapNullable(this[rawDataSymbol].shown_at, (v: string) => new Date(v));
	}
}
