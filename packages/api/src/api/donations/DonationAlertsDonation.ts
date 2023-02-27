import {
	DataObject,
	rawDataSymbol,
	ReadDocumentation,
	type DonationAlertsOutputCurrency
} from '@donation-alerts/common';
import { mapNullable } from '@stimulcross/shared-utils';

/**
 * Type of the alert. Always `Donations` in this case.
 */
export type DonationNameType = 'Donations';

/**
 * The message type. The possible values are `text` for a text messages and `audio` for an audio messages.
 */
export type DonationMessageType = 'text' | 'audio';

/** @internal */
export interface DonationAlertsDonationData {
	id: number;
	name: DonationNameType;
	username: string;
	message_type: DonationMessageType;
	message: string;
	amount: number;
	currency: DonationAlertsOutputCurrency;
	is_shown: 0 | 1;
	created_at: string;
	shown_at: string | null;
}
/**
 * Represents Donation Alerts donation.
 */
@ReadDocumentation('api')
export class DonationAlertsDonation extends DataObject<DonationAlertsDonationData> {
	/**
	 * The unique donation alert identifier.
	 */
	get id(): number {
		return this[rawDataSymbol].id;
	}

	/**
	 * Type of the alert. Always `Donations` in this context.
	 */
	get name(): DonationNameType {
		return this[rawDataSymbol].name;
	}

	/**
	 * The name of the user who sent the donation and the alert.
	 */
	get username(): string {
		return this[rawDataSymbol].username;
	}

	/**
	 * The message type. The possible values are text for a `text` messages and `audio` for an audio messages.
	 */
	get messageType(): DonationMessageType {
		return this[rawDataSymbol].message_type;
	}

	/**
	 * The message sent along with the donation and the alert.
	 */
	get message(): string {
		return this[rawDataSymbol].message;
	}

	/**
	 * The donation amount.
	 */
	get amount(): number {
		return this[rawDataSymbol].amount;
	}

	/**
	 * The currency code (ISO 4217 formatted).
	 */
	get currency(): DonationAlertsOutputCurrency {
		return this[rawDataSymbol].currency;
	}

	/**
	 * Whether the alert was shown in the streamer's widget.
	 */
	get isShown(): boolean {
		return this[rawDataSymbol].is_shown === 1;
	}

	/**
	 * The donation date and time.
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
