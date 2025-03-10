import {
	DataObject,
	rawDataSymbol,
	ReadDocumentation,
	type DonationAlertsOutputCurrency,
} from '@donation-alerts/common';
import { mapNullable } from '@stimulcross/shared-utils';

/**
 * The type of the generated alert.
 */
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
 * Represents Donation Alerts merchandise sale alert as a plain JavaScript object.
 */
export interface DonationAlertsMerchandiseSaleJson {
	id: number;
	name: DonationAlertsMerchandiseSaleAlertType;
	externalId: string;
	username: string | null;
	message: string | null;
	amount: number;
	currency: DonationAlertsOutputCurrency;
	boughtAmount: number;
	creationDate: Date;
	isShown: boolean;
	showDate: Date | null;
}

/**
 * Represents Donation Alerts merchandise sale alert.
 *
 * @remarks
 * This class provides detailed information about merchandise sale alerts
 * generated on the Donation Alerts platform. It includes information about
 * the alert type, customer, amount of the sale, currency, and whether the alert
 * was displayed in the streamer's widget.
 */
@ReadDocumentation('api')
export class DonationAlertsMerchandiseSale extends DataObject<
	DonationAlertsMerchandiseSaleData,
	DonationAlertsMerchandiseSaleJson
> {
	/**
	 * The unique identifier for the merchandise sale alert, assigned by Donation Alerts.
	 *
	 * @returns The alert ID as a number.
	 */
	get id(): number {
		return this[rawDataSymbol].id;
	}

	/**
	 * Type of the generated alert.
	 *
	 * @returns A string representing the alert type, e.g., `'merchandise-sale'`.
	 */
	get name(): DonationAlertsMerchandiseSaleAlertType | string {
		return this[rawDataSymbol].name;
	}

	/**
	 * Unique sale ID generated by the developer.
	 *
	 * @remarks
	 * This ID helps developers associate a sale in Donation Alerts with their own
	 * internal records or database.
	 *
	 * @returns The external sale ID as a string.
	 */
	get externalId(): string {
		return this[rawDataSymbol].external_id;
	}

	/**
	 * The username of the customer who purchased the merchandise.
	 *
	 * @remarks
	 * If the customer's name is not available, `null` is returned.
	 *
	 * @returns The customer's username as a string, or `null` if unknown.
	 */
	get username(): string | null {
		return this[rawDataSymbol].username;
	}

	/**
	 * The message sent by the customer while purchasing the merchandise.
	 *
	 * @remarks
	 * If the message is not provided, `null` is returned.
	 *
	 * @returns The customer's message as a string, or `null` if not provided.
	 */
	get message(): string | null {
		return this[rawDataSymbol].message;
	}

	/**
	 * Grand total amount of the sale.
	 *
	 * @remarks
	 * Total value of the merchandise sale, including all included items.
	 *
	 * @returns The total sale amount as a number.
	 */
	get amount(): number {
		return this[rawDataSymbol].amount;
	}

	/**
	 * The currency of the merchandise sale.
	 *
	 * @remarks
	 * Currency code (ISO 4217) representing the currency in which the sale was made.
	 *
	 * @returns A string representing the currency code.
	 */
	get currency(): DonationAlertsOutputCurrency {
		return this[rawDataSymbol].currency;
	}

	/**
	 * Total number of bought items.
	 *
	 * @returns The number of purchased items as a number.
	 */
	get boughtAmount(): number {
		return this[rawDataSymbol].bought_amount;
	}

	/**
	 * Whether the alert was shown in the streamer's widget.
	 *
	 * @returns `true` if the alert was shown; otherwise, `false`.
	 */
	get isShown(): boolean {
		return this[rawDataSymbol].is_shown === 1;
	}

	/**
	 * The date and time when the sale alert was created.
	 *
	 * @returns A `Date` object representing the creation date of the sale alert.
	 */
	get creationDate(): Date {
		return new Date(this[rawDataSymbol].created_at);
	}

	/**
	 * The date and time when the alert was shown.
	 *
	 * @remarks
	 * If the alert hasn't been shown yet, `null` is returned.
	 *
	 * @returns A `Date` object representing the time the alert was shown, or `null`.
	 */

	get showDate(): Date | null {
		return mapNullable(this[rawDataSymbol].shown_at, (v: string) => new Date(v));
	}

	override toJSON(): DonationAlertsMerchandiseSaleJson {
		return {
			id: this.id,
			name: this.name,
			externalId: this.externalId,
			username: this.username,
			message: this.message,
			amount: this.amount,
			currency: this.currency,
			boughtAmount: this.boughtAmount,
			creationDate: this.creationDate,
			isShown: this.isShown,
			showDate: this.showDate,
		};
	}
}
