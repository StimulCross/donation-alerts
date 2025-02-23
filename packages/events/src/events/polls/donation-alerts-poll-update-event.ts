import { DataObject, rawDataSymbol, ReadDocumentation } from '@donation-alerts/common';
import { Memoize } from 'typescript-memoize';
import { DonationAlertsPollOption, type DonationAlertsPollOptionData } from './donation-alerts-poll-option';

/**
 * Type of the poll that defines how poll winner is calculated. `count` - finds winner by the most number of donations;
 * `sum` - finds winner by the most sum of donations.
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
 * Represents Donation Alerts updated poll object.
 */
@ReadDocumentation('events')
export class DonationAlertsPollUpdateEvent extends DataObject<DonationAlertsPollUpdateEventData> {
	/**
	 * The unique poll identifier.
	 */
	get id(): number {
		return this[rawDataSymbol].id;
	}

	/**
	 * A flag indicating whether the poll is in progress or not.
	 */
	get isActive(): boolean {
		return this[rawDataSymbol].is_active === 1;
	}

	/**
	 * The poll title.
	 */
	get title(): string {
		return this[rawDataSymbol].title;
	}

	/**
	 * A flag indicating whether the poll allows donors to add their own poll options or not.
	 */
	get allowUserOptions(): boolean {
		return this[rawDataSymbol].allow_user_options === 1;
	}

	/**
	 * Type of the poll that defines how poll winner is calculated. `count` - finds winner by the most number of
	 * donations; `sum` - finds winner by the most sum of donations.
	 */
	get type(): DonationAlertsPollType {
		return this[rawDataSymbol].type;
	}

	/**
	 * Array of available poll options.
	 */
	@Memoize()
	get options(): DonationAlertsPollOption[] {
		return this[rawDataSymbol].options.map(option => new DonationAlertsPollOption(option));
	}
}
