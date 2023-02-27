import {
	DataObject,
	rawDataSymbol,
	ReadDocumentation,
	type DonationAlertsInputCurrency
} from '@donation-alerts/common';
import { mapNullable } from '@stimulcross/shared-utils';

/** @internal */
export interface DonationAlertsGoalUpdateEventData {
	id: number;
	is_active: 0 | 1;
	title: string;
	currency: DonationAlertsInputCurrency;
	start_amount: number;
	raised_amount: number;
	goal_amount: number;
	started_at: string;
	expires_at: string | null;
}

/**
 * Represents Donation Alerts goal update object.
 */
@ReadDocumentation('events')
export class DonationAlertsGoalUpdateEvent extends DataObject<DonationAlertsGoalUpdateEventData> {
	/**
	 * The unique donation goal identifier.
	 */
	get id(): number {
		return this[rawDataSymbol].id;
	}

	/**
	 * A flag indicating whether the donation goal is in progress or not.
	 */
	get isActive(): boolean {
		return this[rawDataSymbol].is_active === 1;
	}

	/**
	 * The donation goal title.
	 */
	get title(): string {
		return this[rawDataSymbol].title;
	}

	/**
	 * The currency code of the donation goal (ISO 4217 formatted).
	 */
	get currency(): DonationAlertsInputCurrency {
		return this[rawDataSymbol].currency;
	}

	/**
	 * Starting amount of the donation goal.
	 */
	get startAmount(): number {
		return this[rawDataSymbol].start_amount;
	}

	/**
	 * Currently raised amount including the `startAmount` value.
	 */
	get raisedAmount(): number {
		return this[rawDataSymbol].raised_amount;
	}

	/**
	 * Goal amount of the donation goal.
	 */
	get goalAmount(): number {
		return this[rawDataSymbol].goal_amount;
	}

	/**
	 * The date and time when donation goal was started.
	 */
	get startDate(): Date {
		return new Date(this[rawDataSymbol].started_at);
	}

	/**
	 * The date and time when donation goal is scheduled to end. Or `null` if end date is not set.
	 */
	get expiryDate(): Date | null {
		return mapNullable(this[rawDataSymbol].expires_at, (v: string) => new Date(v));
	}
}
