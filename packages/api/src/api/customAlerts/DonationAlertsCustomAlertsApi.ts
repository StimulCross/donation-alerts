import { type RateLimiterRequestOptions } from '@d-fischer/rate-limiter';
import { ReadDocumentation, type UserIdResolvable } from '@donation-alerts/common';
import { DonationAlertsCustomAlert, type DonationAlertsCustomAlertData } from './DonationAlertsCustomAlert';
import { BaseApi } from '../BaseApi';
import { type DonationAlertsResponseSingleData } from '../DonationAlertsResponse';

/**
 * Data to send with a custom alert.
 */
export interface DonationAlertsSendCustomAlertData {
	/**
	 * Up to 32 characters long unique alert ID generated by the application developer.
	 */
	externalId?: string;

	/**
	 * Up to 255 characters long string that will be displayed as a header.
	 */
	header?: string;

	/**
	 * Up to 300 characters long string that will be displayed inside the message box.
	 */
	message?: string;

	/**
	 * Determines whether the alert should be displayed or not. Defaults to `false`.
	 */
	shouldShow?: boolean;

	/**
	 * Up to 255 characters long URL to the image file that will be displayed along with the custom alert.
	 */
	imageUrl?: string;

	/**
	 * Up to 255 characters long URL to the sound file that will be played when displaying the custom alert.
	 */
	soundUrl?: string;
}

/**
 * Custom alerts are the fully content-customizable alerts that allow the developer to create uniquely designed alerts
 * and send it to the streamer's broadcast.
 *
 * It is required for the streamer to have a variation for the Alerts widget with "Custom alerts" type for custom alerts
 * to display.
 */
@ReadDocumentation('api')
export class DonationAlertsCustomAlertsApi extends BaseApi {
	/**
	 * Sends custom alert to the authorized user.
	 *
	 * Requires `oauth-custom_alert-store` scope.
	 *
	 * @param user The ID of the user to send a custom alert to.
	 * @param data The data to send.
	 * @param rateLimiterOptions The rate limiter options.
	 *
	 * @throws {@link HttpError} if response status code is out of 200-299 range.
	 * @throws {@link UnregisteredUserError} if the user you are trying to get is not registered in authentication provider.
	 * @throws {@link MissingScopeError} if the access token does not have `oauth-custom_alert-store` scope.
	 */
	async sendCustomAlert(
		user: UserIdResolvable,
		data: DonationAlertsSendCustomAlertData,
		rateLimiterOptions?: RateLimiterRequestOptions
	): Promise<DonationAlertsCustomAlert> {
		const response = await this._apiClient.callApi<DonationAlertsResponseSingleData<DonationAlertsCustomAlertData>>(
			user,
			{
				type: 'api',
				url: 'custom_alert',
				method: 'POST',
				scope: 'oauth-custom_alert-store',
				formBody: {
					external_id: data.externalId,
					header: data.header,
					message: data.message,
					is_shown: data.shouldShow ?? true ? '0' : '1',
					image_url: data.imageUrl,
					sound_url: data.soundUrl
				},
				auth: true
			},
			rateLimiterOptions
		);

		return new DonationAlertsCustomAlert(response.data);
	}
}
