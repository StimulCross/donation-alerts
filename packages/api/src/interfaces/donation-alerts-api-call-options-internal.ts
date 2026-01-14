import { type DonationAlertsApiCallOptions, type DonationAlertsCallFetchOptions } from '@donation-alerts/api-call';

/** @internal */
export interface DonationAlertsApiCallOptionsInternal {
	options: DonationAlertsApiCallOptions;
	accessToken?: string;
	fetchOptions?: DonationAlertsCallFetchOptions;
}
