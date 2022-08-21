import { mapOptional } from '@stimulcross/shared-utils';
import type { RateLimiterRequestOptions } from '@d-fischer/rate-limiter';
import type { DonationAlertsInputCurrency, DonationAlertsLocaleCode, UserIdResolvable } from '@donation-alerts/common';
import { ReadDocumentation } from '@donation-alerts/common';
import { BaseApi } from '../BaseApi';
import type { DonationAlertsResponseSingleData } from '../DonationAlertsResponse';
import { createSha256SignatureFromParams } from '../../utils/createSha256SignatureFromParams';
import type { DonationAlertsMerchandiseData } from './DonationAlertsMerchandise';
import { DonationAlertsMerchandise } from './DonationAlertsMerchandise';
import type { DonationAlertsMerchandiseSaleData } from './DonationAlertsMerchandiseSale';
import { DonationAlertsMerchandiseSale } from './DonationAlertsMerchandiseSale';

/**
 * Title of the merchandise in different locales. At minimum, a title for the `en_US` locale is required.
 */
export interface DonationAlertsCreateMerchandiseTitleData extends Partial<Record<DonationAlertsLocaleCode, string>> {
	en_US: string;
}

/**
 * Create merchandise data.
 */
export interface DonationAlertsCreateMerchandiseData {
	/**
	 * Merchant's ID on DonationAlerts.
	 */
	merchantIdentifier: string;

	/**
	 * Up to 16 characters long unique merchandise ID generated by the merchant.
	 */
	merchandiseIdentifier: string;

	/**
	 * Title of the merchandise in different locales. At minimum, a title for the `en_US` locale is required.
	 */
	title: DonationAlertsCreateMerchandiseTitleData;

	/**
	 * Whether the merchandise is available for purchase or not. Defaults to `false`.
	 */
	isActive?: boolean;

	/**
	 * Whether the `priceService` and `priceUser` parameters are recognized as amounts in a currency of the currency
	 * parameter or calculated.
	 */
	isPercentage?: boolean;

	/**
	 * One of the available currencies of merchandise. All revenue calculations will be performed according this value.
	 */
	currency: DonationAlertsInputCurrency;

	/**
	 * Amount of revenue added to streamer for each sale of the merchandise.
	 */
	priceUser: number;

	/**
	 * Amount of revenue added to DonationAlerts for each sale of the merchandise.
	 */
	priceService: number;

	/**
	 * Up to 128 characters long URL to the merchandise's web page. You may include the `{user_id}` and
	 * `{merchandise_promocode}` patterns in the URL that will be replaced in a UI with the user's ID and user's
	 * merchandise promocode.
	 */
	url?: string;

	/**
	 * Up to 128 characters long URL to the merchandise's image.
	 */
	imageUrl?: string;

	/**
	 * Date and time when the merchandise becomes inactive represented as Unix timestamp.
	 */
	endTimestamp?: number;
}

/**
 * Update merchandise data.
 */
export interface DonationAlertsUpdateMerchandiseData {
	/**
	 * Merchant's ID on DonationAlerts.
	 */
	merchantIdentifier?: string;

	/**
	 * Up to 16 characters long unique merchandise ID generated by the merchant.
	 */
	merchandiseIdentifier?: string;

	/**
	 * Title of the merchandise in different locales. At minimum, a title for the `en_US` locale is required.
	 */
	title?: DonationAlertsCreateMerchandiseTitleData;

	/**
	 * Whether the merchandise is available for purchase or not. Defaults to `false`.
	 */
	isActive?: boolean;

	/**
	 * Whether the `priceService` and `priceUser` parameters are recognized as amounts in a currency of the currency
	 * parameter or calculated.
	 */
	isPercentage?: boolean;

	/**
	 * One of the available currencies of merchandise. All revenue calculations will be performed according this value.
	 */
	currency?: DonationAlertsInputCurrency;

	/**
	 * Amount of revenue added to streamer for each sale of the merchandise.
	 */
	priceUser?: number;

	/**
	 * Amount of revenue added to DonationAlerts for each sale of the merchandise.
	 */
	priceService?: number;

	/**
	 * Up to 128 characters long URL to the merchandise's web page. You may include the `{user_id}` and
	 * `{merchandise_promocode}` patterns in the URL that will be replaced in a UI with the user's ID and user's
	 * merchandise promocode.
	 */
	url?: string;

	/**
	 * Up to 128 characters long URL to the merchandise's image.
	 */
	imageUrl?: string;

	/**
	 * Date and time when the merchandise becomes inactive represented as Unix timestamp.
	 */
	endTimestamp?: number;
}

/**
 * Send sale alert data.
 */
export interface DonationAlertsSendMerchandiseSaleAlertData {
	/**
	 * Up to 32 characters long unique sale ID generated by the developer.
	 */
	externalId: string;

	/**
	 * Merchant's ID on DonationAlerts.
	 */
	merchantIdentifier: string;

	/**
	 * Merchant's merchandise ID which was bought by the customer.
	 */
	merchandiseIdentifier: string;

	/**
	 * Grand total of the sale.
	 */
	amount: number;

	/**
	 * One of the available currencies of merchandise sale indicating the currency of `amount`.
	 */
	currency: string;

	/**
	 * Total number of bought items. Defaults to `1`.
	 */
	boughtAmount?: number;

	/**
	 * The name of the customer.
	 */
	username?: string;

	/**
	 * The message sent by the customer while purchasing the merchandise.
	 */
	message?: string;
}

/**
 * The Merchandises API is a set of the API methods that allow the merchant to sell their merchandise via
 * DonationAlerts' streamers using a revenue sharing model.
 * Using provided API methods it's possible to create and update merchandises, and to notify DonationAlerts when new
 * sale occurs.
 *
 * Please note that the access to this API is given as per request.
 * For more details about integration contact us via business@donationalerts.com.
 */
@ReadDocumentation('api')
export class DonationAlertsMerchandiseApi extends BaseApi {
	/**
	 * Creates new merchandise.
	 *
	 * @param user The ID of the user to use the access token of.
	 * @param clientSecret The application client secret. Keep in mind that the secret must be associated with the
	 * application that the user has authorized.
	 * @param data The merchandise data to create.
	 * @param rateLimiterOptions? Rate limiter options.
	 *
	 * @throws {@link HttpError} if response status code is out of 200-299 range.
	 * @throws {@link UnregisteredUserError} if the user you are trying to get is not registered in authentication provider.
	 */
	async createMerchandise(
		user: UserIdResolvable,
		clientSecret: string,
		data: DonationAlertsCreateMerchandiseData,
		rateLimiterOptions?: RateLimiterRequestOptions
	): Promise<DonationAlertsMerchandise> {
		const formData = {
			merchant_identifier: data.merchantIdentifier,
			merchandise_identifier: data.merchandiseIdentifier,
			title: data.title,
			is_active: data.isActive ? '1' : '0',
			is_percentage: data.isPercentage ? '1' : '0',
			currency: data.currency,
			price_user: data.priceUser,
			price_service: data.priceService,
			url: data.url,
			img_url: data.imageUrl,
			end_at_ts: data.endTimestamp
		};

		const signature = createSha256SignatureFromParams(formData, clientSecret);

		const response = await this._apiClient.callApi<DonationAlertsResponseSingleData<DonationAlertsMerchandiseData>>(
			user,
			{
				type: 'api',
				url: 'merchandise',
				method: 'POST',
				formBody: { ...formData, signature }
			},
			rateLimiterOptions
		);

		return new DonationAlertsMerchandise(response.data);
	}

	/**
	 * Updates merchandise.
	 *
	 * @param user The ID of the user to use the access token of.
	 * @param clientSecret The application client secret. Keep in mind that the secret must be associated with the
	 * application that the user has authorized.
	 * @param merchandiseId The ID of the merchandise.
	 * @param data The merchandise data to create.
	 * @param rateLimiterOptions?? Rate limiter options.
	 *
	 * @throws {@link HttpError} if response status code is out of 200-299 range.
	 * @throws {@link UnregisteredUserError} if the user you are trying to get is not registered in authentication provider.
	 */
	async updateMerchandise(
		user: UserIdResolvable,
		clientSecret: string,
		merchandiseId: number | string,
		data: DonationAlertsUpdateMerchandiseData,
		rateLimiterOptions?: RateLimiterRequestOptions
	): Promise<DonationAlertsMerchandise> {
		const formData = {
			merchant_identifier: data.merchantIdentifier,
			merchandise_identifier: data.merchandiseIdentifier,
			title: data.title,
			is_active: mapOptional(data.isActive, (v: boolean) => (v ? '1' : '0')),
			is_percentage: mapOptional(data.isPercentage, (v: boolean) => (v ? '1' : '0')),
			currency: data.currency,
			price_user: data.priceUser,
			price_service: data.priceService,
			url: data.url,
			img_url: data.imageUrl,
			end_at_ts: data.endTimestamp
		};

		const signature = createSha256SignatureFromParams(formData, clientSecret);

		const response = await this._apiClient.callApi<DonationAlertsResponseSingleData<DonationAlertsMerchandiseData>>(
			user,
			{
				type: 'api',
				url: `merchandise/${merchandiseId}`,
				method: 'PUT',
				formBody: { ...formData, signature }
			},
			rateLimiterOptions
		);

		return new DonationAlertsMerchandise(response.data);
	}

	/**
	 * Creates new merchandise sale alert.
	 *
	 * @param user DonationAlerts' user ID to which this merchandise sale referenced.
	 * @param clientSecret The application client secret. Keep in mind that the secret must be associated with the
	 * application that the user has authorized.
	 * @param data DonationAlerts' sale alert data.
	 * @param rateLimiterOptions? Rate limiter options.
	 *
	 * @throws {@link HttpError} if response status code is out of 200-299 range.
	 * @throws {@link UnregisteredUserError} if the user you are trying to get is not registered in authentication provider.
	 */
	async sendSaleAlert(
		user: UserIdResolvable,
		clientSecret: string,
		data: DonationAlertsSendMerchandiseSaleAlertData,
		rateLimiterOptions?: RateLimiterRequestOptions
	): Promise<DonationAlertsMerchandiseSale> {
		const formData = {
			external_id: data.externalId,
			merchant_identifier: data.merchantIdentifier,
			merchandise_identifier: data.merchandiseIdentifier,
			amount: data.amount,
			currency: data.currency,
			boughtAmount: data.boughtAmount,
			username: data.username,
			message: data.message
		};

		const signature = createSha256SignatureFromParams(formData, clientSecret);

		const response = await this._apiClient.callApi<
			DonationAlertsResponseSingleData<DonationAlertsMerchandiseSaleData>
		>(
			user,
			{
				type: 'api',
				url: '',
				method: 'POST',
				formBody: { ...formData, signature }
			},
			rateLimiterOptions
		);

		return new DonationAlertsMerchandiseSale(response.data);
	}
}
