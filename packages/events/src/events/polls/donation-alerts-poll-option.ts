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
 * Represents Donation Alerts poll option.
 */
@ReadDocumentation('events')
export class DonationAlertsPollOption extends DataObject<DonationAlertsPollOptionData> {
	/**
	 * The unique poll option identifier.
	 */
	get id(): number {
		return this[rawDataSymbol].id;
	}

	/**
	 * The poll option title.
	 */
	get title(): string {
		return this[rawDataSymbol].title;
	}

	/**
	 * The absolute value of poll option. Depending on poll `type` the value may contain number or sum of donations.
	 */
	get amountValue(): number {
		return this[rawDataSymbol].amount_value;
	}

	/**
	 * The percent value of poll option relative other poll options.
	 */
	get amountPercent(): number {
		return this[rawDataSymbol].amount_percent;
	}

	/**
	 * A flag indicating whether the poll option is the poll winner or not. Please note that poll may have multiple
	 * winners if maximum `amountValue` value is shared by several poll options.
	 */
	get isWinner(): boolean {
		return this[rawDataSymbol].is_winner === 1;
	}
}
