import { DataObject, rawDataSymbol, ReadDocumentation } from '@donation-alerts/common';

/** @internal */
export interface DonationAlertsCentrifugoChannelsResponseData {
	channels: DonationAlertsCentrifugoChannel[];
}

/** @internal */
export interface DonationAlertsCentrifugoChannelData {
	channel: string;
	token: string;
}

/**
 * Represents a Donation Alerts Centrifugo private channel.
 *
 * @remarks
 * This class provides access to a private channel's data, including its name (`channel`)
 * and the token required to connect to this channel (`token`).
 */
@ReadDocumentation('api')
export class DonationAlertsCentrifugoChannel extends DataObject<DonationAlertsCentrifugoChannelData> {
	/**
	 * The private channel name.
	 *
	 * @example
	 * `$alerts:donation_12345`.
	 */
	get channel(): string {
		return this[rawDataSymbol].channel;
	}

	/**
	 * The Centrifugo connection token.
	 *
	 * @remarks
	 * This token is required to establish a connection to the respective private channel.
	 */
	get token(): string {
		return this[rawDataSymbol].token;
	}
}
