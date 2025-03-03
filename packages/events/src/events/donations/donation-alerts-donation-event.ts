import {
	DataObject,
	rawDataSymbol,
	ReadDocumentation,
	type DonationAlertsOutputCurrency,
} from '@donation-alerts/common';
import { mapNullable } from '@stimulcross/shared-utils';

/**
 * Type of the alert. Always `Donations` in this case.
 */
export type DonationEventNameType = 'Donations';

/**
 * The message type for donations.
 *
 * @remarks
 * The message can either be a plain text message (`text`) or a message containing audio (`audio`).
 */
export type DonationEventMessageType = 'text' | 'audio';

/** @internal */
export interface DonationAlertsDonationEventData {
	id: number;
	name: DonationEventNameType;
	username: string;
	message_type: DonationEventMessageType;
	message: string;
	amount: number;
	currency: DonationAlertsOutputCurrency;
	is_shown: 0 | 1;
	created_at: string;
	shown_at: string | null;
}

/**
 * Represents a Donation Alerts donation event as a plain JavaScript object.
 */
export interface DonationAlertsDonationEventJson {
	id: number;
	name: DonationEventNameType;
	username: string;
	messageType: DonationEventMessageType;
	message: string;
	amount: number;
	currency: DonationAlertsOutputCurrency;
	isShown: boolean;
	creationDate: Date;
	showDate: Date | null;
}

/**
 * Represents a Donation Alerts donation event.
 *
 * @remarks
 * This class provides detailed information about a donation, including user details, donation amount, message,
 * currency, and timestamps for creation and display.
 */
@ReadDocumentation('events')
export class DonationAlertsDonationEvent extends DataObject<
	DonationAlertsDonationEventData,
	DonationAlertsDonationEventJson
> {
	/**
	 * The unique identifier for the donation alert.
	 */
	get id(): number {
		return this[rawDataSymbol].id;
	}

	/**
	 * The type of the alert.
	 *
	 * @remarks
	 * Always returns `Donations` in this context.
	 */
	get name(): DonationEventNameType {
		return this[rawDataSymbol].name;
	}

	/**
	 * The username of the donor.
	 *
	 * @remarks
	 * This is the name that the user who sent the donation chose to display publicly.
	 */
	get username(): string {
		return this[rawDataSymbol].username;
	}

	/**
	 * The type of the message accompanying the donation.
	 *
	 * @remarks
	 * Possible values:
	 * - `text` — A plain text message sent with the donation.
	 * - `audio` — A message that includes an audio component.
	 */
	get messageType(): DonationEventMessageType {
		return this[rawDataSymbol].message_type;
	}

	/**
	 * The message sent by the donor along with the donation.
	 */
	get message(): string {
		return this[rawDataSymbol].message;
	}

	/**
	 * The donated amount.
	 */
	get amount(): number {
		return this[rawDataSymbol].amount;
	}

	/**
	 * The currency of the donated amount.
	 *
	 * @remarks
	 * This value represents the currency code in ISO 4217 format (e.g., `USD`, `EUR`, `RUB`).
	 */
	get currency(): DonationAlertsOutputCurrency {
		return this[rawDataSymbol].currency;
	}

	/**
	 * Indicates whether the alert was shown in the streamer's widget.
	 *
	 * @returns `true` if the donation alert has been displayed; otherwise, `false`.
	 */
	get isShown(): boolean {
		return this[rawDataSymbol].is_shown === 1;
	}

	/**
	 * The date and time when the donation was received.
	 *
	 * @returns A `Date` object representing the donation creation time.
	 */
	get creationDate(): Date {
		return new Date(this[rawDataSymbol].created_at);
	}

	/**
	 * The date and time when the alert was shown on the streamer's widget.
	 *
	 * @returns A `Date` object if the alert was shown; `null` otherwise.
	 */
	get showDate(): Date | null {
		return mapNullable(this[rawDataSymbol].shown_at, (v: string) => new Date(v));
	}

	override toJSON(): DonationAlertsDonationEventJson {
		return {
			id: this.id,
			name: this.name,
			username: this.username,
			messageType: this.messageType,
			message: this.message,
			amount: this.amount,
			currency: this.currency,
			isShown: this.isShown,
			creationDate: this.creationDate,
			showDate: this.showDate,
		};
	}
}
