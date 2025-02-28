import { DataObject, rawDataSymbol, ReadDocumentation } from '@donation-alerts/common';
import { Memoize } from 'typescript-memoize';
import { DonationAlertsPollOption, type DonationAlertsPollOptionData } from './donation-alerts-poll-option';

/**
 * The type of a poll, which determines the way the winner is calculated:
 * - `count`: The winner is the option with the most number of donations.
 * - `sum`: The winner is the option with the highest total sum of donations.
 */
export type DonationAlertsPollType = 'count' | 'sum';

/** @internal */
export interface DonationAlertsPollUpdateEventData {
	id: number;
	is_active: 0 | 1;
	title: string;
	allow_user_options: 0 | 1;
	type: DonationAlertsPollType;
	options: DonationAlertsPollOptionData[];
}

/**
 * Represents an updated poll object from Donation Alerts.
 *
 * @remarks
 * This class provides access to key properties of a poll, including its options
 * and configuration details. It also indicates whether the poll is active or not.
 */
@ReadDocumentation('events')
export class DonationAlertsPollUpdateEvent extends DataObject<DonationAlertsPollUpdateEventData> {
	/**
	 * The unique identifier of the poll.
	 */
	get id(): number {
		return this[rawDataSymbol].id;
	}

	/**
	 * Indicates whether the poll is currently active.
	 *
	 * @returns `true` if the poll is active, otherwise `false`.
	 */
	get isActive(): boolean {
		return this[rawDataSymbol].is_active === 1;
	}

	/**
	 * The title of the poll.
	 */
	get title(): string {
		return this[rawDataSymbol].title;
	}

	/**
	 * Indicates whether donors are allowed to add custom options to the poll.
	 *
	 * @returns `true` if custom options are allowed, otherwise `false`.
	 */
	get allowUserOptions(): boolean {
		return this[rawDataSymbol].allow_user_options === 1;
	}

	/**
	 * The type of the poll, determining how the winner is calculated.
	 *
	 * @remarks
	 * - `count`: The option with the most donations wins.
	 * - `sum`: The option with the highest total donation sum wins.
	 */
	get type(): DonationAlertsPollType {
		return this[rawDataSymbol].type;
	}

	/**
	 * The list of available options for the poll.
	 *
	 * @remarks
	 * Each option is represented as an instance of {@link DonationAlertsPollOption}.
	 */
	@Memoize()
	get options(): DonationAlertsPollOption[] {
		return this[rawDataSymbol].options.map(option => new DonationAlertsPollOption(option));
	}
}
