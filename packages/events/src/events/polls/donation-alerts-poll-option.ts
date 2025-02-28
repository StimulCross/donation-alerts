import { DataObject, rawDataSymbol, ReadDocumentation } from '@donation-alerts/common';

/** @internal */
export interface DonationAlertsPollOptionData {
	id: number;
	title: string;
	amount_value: number;
	amount_percent: number;
	is_winner: 0 | 1;
}

/**
 * Represents an option in a Donation Alerts poll event.
 *
 * @remarks
 * This class provides structured access to the properties of a single poll option
 * and helps identify important metrics, such as the total value and its relative percentage.
 */
@ReadDocumentation('events')
export class DonationAlertsPollOption extends DataObject<DonationAlertsPollOptionData> {
	/**
	 * The unique identifier of the poll option.
	 */
	get id(): number {
		return this[rawDataSymbol].id;
	}

	/**
	 * The title of the poll option.
	 */
	get title(): string {
		return this[rawDataSymbol].title;
	}

	/**
	 * The absolute value associated with this poll option.
	 *
	 * @remarks
	 * Depending on the poll's type, the `amountValue` represents either the total number of donations
	 * or the total sum of donations for this option.
	 */
	get amountValue(): number {
		return this[rawDataSymbol].amount_value;
	}

	/**
	 * The relative percentage of this poll option compared to others.
	 *
	 * @remarks
	 * This percentage reflects the option's share of the total amount across all poll options.
	 */
	get amountPercent(): number {
		return this[rawDataSymbol].amount_percent;
	}

	/**
	 * Indicates whether this poll option is a winner.
	 *
	 * @remarks
	 * A poll can have multiple winners if more than one option shares the maximum `amountValue`.
	 *
	 * @returns `true` if the poll option is a winner, otherwise `false`.
	 */
	get isWinner(): boolean {
		return this[rawDataSymbol].is_winner === 1;
	}
}
