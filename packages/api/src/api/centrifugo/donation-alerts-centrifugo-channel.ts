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
 * Represents Donation Alerts Centrifuge channel.
 */
@ReadDocumentation('api')
export class DonationAlertsCentrifugoChannel extends DataObject<DonationAlertsCentrifugoChannelData> {
	/**
	 * Private channel name.
	 */
	get channel(): string {
		return this[rawDataSymbol].channel;
	}

	/**
	 * Centrifugo connection token. This token can be used to connect to the private channel.
	 */
	get token(): string {
		return this[rawDataSymbol].token;
	}
}
