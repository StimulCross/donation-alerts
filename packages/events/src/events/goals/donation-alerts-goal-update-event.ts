import {
	DataObject,
	rawDataSymbol,
	ReadDocumentation,
	type DonationAlertsInputCurrency,
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
 * Represents a goal update event from Donation Alerts.
 *
 * @remarks
 * This object provides structured access to the properties of a donation goal,
 * including its current state, progress, and relevant timestamps.
 */
@ReadDocumentation('events')
export class DonationAlertsGoalUpdateEvent extends DataObject<DonationAlertsGoalUpdateEventData> {
	/**
	 * The unique identifier for the donation goal.
	 */
	get id(): number {
		return this[rawDataSymbol].id;
	}

	/**
	 * Indicates whether the donation goal is currently active.
	 *
	 * @returns `true` if the goal is active, otherwise `false`.
	 */
	get isActive(): boolean {
		return this[rawDataSymbol].is_active === 1;
	}

	/**
	 * The title or name of the donation goal.
	 */
	get title(): string {
		return this[rawDataSymbol].title;
	}

	/**
	 * The currency in which the goal is measured.
	 *
	 * @remarks
	 * The currency code formatted as per ISO 4217 standard
	 */
	get currency(): DonationAlertsInputCurrency {
		return this[rawDataSymbol].currency;
	}

	/**
	 * The starting amount of the donation goal.
	 *
	 * @remarks
	 * This value represents the base amount from which the progress begins.
	 */
	get startAmount(): number {
		return this[rawDataSymbol].start_amount;
	}

	/**
	 * The total amount raised so far, including the `startAmount`.
	 *
	 * @remarks
	 * This value reflects the sum of all donations added to the starting amount.
	 */
	get raisedAmount(): number {
		return this[rawDataSymbol].raised_amount;
	}

	/**
	 * The target or goal amount for the donation.
	 */
	get goalAmount(): number {
		return this[rawDataSymbol].goal_amount;
	}

	/**
	 * The date and time when the donation goal was started.
	 *
	 * @returns A `Date` object representing the start time of the goal.
	 */
	get startDate(): Date {
		return new Date(this[rawDataSymbol].started_at);
	}

	/**
	 * The scheduled end date and time for the donation goal.
	 *
	 * @remarks
	 * This value can be `null` if no expiry date is set for the goal.
	 *
	 * @returns A `Date` object representing the expiry date of the goal,
	 * or `null` if the goal has no end date.
	 */
	get expiryDate(): Date | null {
		return mapNullable(this[rawDataSymbol].expires_at, (v: string) => new Date(v));
	}
}
