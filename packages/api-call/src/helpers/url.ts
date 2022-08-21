import type { DonationAlertsCallType } from '../DonationAlertsApiCallOptions';

/** @internal */
export function getDonationAlertsApiUrl(url: string, type: DonationAlertsCallType): string {
	switch (type) {
		case 'api':
			return `https://www.donationalerts.com/api/v1/${url.replace(/^\//u, '')}`;

		case 'auth':
			return `https://www.donationalerts.com/oauth/${url.replace(/^\//u, '')}`;

		case 'custom':
			return url;

		default:
			return url;
	}
}
