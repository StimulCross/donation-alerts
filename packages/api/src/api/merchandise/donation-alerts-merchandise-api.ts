import { type RateLimiterRequestOptions } from '@d-fischer/rate-limiter';
import {
	ReadDocumentation,
	type DonationAlertsInputCurrency,
	type DonationAlertsLocaleCode,
	type UserIdResolvable,
} from '@donation-alerts/common';
import { mapOptional } from '@stimulcross/shared-utils';
import { DonationAlertsMerchandise, type DonationAlertsMerchandiseData } from './donation-alerts-merchandise';
import {
	DonationAlertsMerchandiseSale,
	type DonationAlertsMerchandiseSaleData,
} from './donation-alerts-merchandise-sale';
import { createSha256SignatureFromParams } from '../../utils/create-sha256-signature-from-params';
import { BaseApi } from '../base-api';
import { type DonationAlertsResponseSingleData } from '../donation-alerts-response';

/**
 * Title of the merchandise in different locales.
 *
 * @remarks
 * At minimum, a title for the `en_US` locale is required.
 */
export interface DonationAlertsCreateMerchandiseTitleData extends Partial<Record<DonationAlertsLocaleCode, string>> {
	en_US: string;
}

/**
 * Data required to create a merchandise item.
 */
export interface DonationAlertsCreateMerchandiseData {
	/**
	 * Merchant's ID on DonationAlerts.
	 */
	merchantIdentifier: string;

	/**
	 * A unique, merchant-defined merchandise ID (maximum length: 16 characters).
	 */
	merchandiseIdentifier: string;

	/**
	 * Localized titles for merchandise.
	 *
	 * @remarks
	 * At least `en_US` is required
	 */
	title: DonationAlertsCreateMerchandiseTitleData;

	/**
	 * Whether the merchandise is available for purchase. Defaults to `false`.
	 */
	isActive?: boolean;

	/**
	 * Determines if `priceService` and `priceUser` represent
	 * percentages (`true`) or absolute values (`false`).
	 */
	isPercentage?: boolean;

	/**
	 * The ISO 4217 currency code for the merchandise.
	 *
	 * All revenue values are calculated based on this currency.
	 */
	currency: DonationAlertsInputCurrency;

	/**
	 * Revenue amount received by the streamer per sale.
	 */
	priceUser: number;

	/**
	 * Revenue amount received by DonationAlerts per sale.
	 */
	priceService: number;

	/**
	 * URL to the merchandise web page.
	 *
	 * @remarks
	 * This supports placeholders like `{user_id}` and `{merchandise_promocode}`,
	 * which are replaced dynamically in the UI.
	 */
	url?: string;

	/**
	 * URL to the merchandise's image (maximum length: 128 characters).
	 */
	imageUrl?: string;

	/**
	 * Unix timestamp indicating when the merchandise becomes inactive.
	 */
	endTimestamp?: number;
}

/**
 * Data required to update existing merchandise.
 */
export type DonationAlertsUpdateMerchandiseData = Partial<DonationAlertsCreateMerchandiseData>;

/**
 * Data structure for sending a merchandise sale alert.
 */
export interface DonationAlertsSendMerchandiseSaleAlertData {
	/**
	 * A unique developer-generated ID for the sale (maximum length: 32 characters).
	 */
	externalId: string;

	/**
	 * Merchant's ID on DonationAlerts.
	 */
	merchantIdentifier: string;

	/**
	 * The ID of the merchandise item sold.
	 */
	merchandiseIdentifier: string;

	/**
	 * The total value of the sale.
	 */
	amount: number;

	/**
	 * ISO 4217 currency code corresponding to the `amount`.
	 */
	currency: string;

	/**
	 * Number of items purchased. Defaults to `1`.
	 */
	boughtAmount?: number;

	/**
	 * The customer's name.
	 */
	username?: string;

	/**
	 * A message from the customer related to their purchase.
	 */
	message?: string;
}

/**
 * API for managing DonationAlerts' merchandise sales and items.
 *
 * @remarks
 * The `DonationAlertsMerchandiseApi` provides methods to create, update, and manage merchandise items,
 * as well as to notify DonationAlerts of new sales.
 * Merchants can use this API to integrate sales systems with DonationAlerts' platform, enabling
 * streamers to sell merchandise with flexible revenue sharing. Access is granted upon request.
 * For details, contact `business@donationalerts.com`.
 */
@ReadDocumentation('api')
export class DonationAlertsMerchandiseApi extends BaseApi {
	/**
	 * Creates a new merchandise item.
	 *
	 * @param user The ID of the authorized user.
	 * @param clientSecret The application client secret associated with the authorized application.
	 * @param data The details of the merchandise item to create.
	 * @param rateLimiterOptions Optional rate limiter settings.
	 *
	 * @returns An instance of {@link DonationAlertsMerchandise} representing the created item.
	 *
	 * @throws {@link HttpError} if the response status code is not in the 200-299 range.
	 * @throws {@link UnregisteredUserError} if the user is not registered in the authentication provider.
	 */
	async createMerchandise(
		user: UserIdResolvable,
		clientSecret: string,
		data: DonationAlertsCreateMerchandiseData,
		rateLimiterOptions?: RateLimiterRequestOptions,
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
			end_at_ts: data.endTimestamp,
		};

		const signature = createSha256SignatureFromParams(formData, clientSecret);

		const response = await this._apiClient.callApi<DonationAlertsResponseSingleData<DonationAlertsMerchandiseData>>(
			user,
			{
				type: 'api',
				url: 'merchandise',
				method: 'POST',
				formBody: { ...formData, signature },
			},
			rateLimiterOptions,
		);

		return new DonationAlertsMerchandise(response.data);
	}

	/**
	 * Updates an existing merchandise item.
	 *
	 * @param user The ID of the authorized user.
	 * @param clientSecret The application client secret associated with the authorized application.
	 * @param merchandiseId The ID of the merchandise to update.
	 * @param data The modified data for the merchandise item.
	 * @param rateLimiterOptions Optional rate limiter settings.
	 *
	 * @returns An updated instance of `DonationAlertsMerchandise`.
	 *
	 * @throws {@link HttpError} if the response status code is not in the 200-299 range.
	 * @throws {@link UnregisteredUserError} if the user is not registered in the authentication provider.
	 */
	async updateMerchandise(
		user: UserIdResolvable,
		clientSecret: string,
		merchandiseId: number | string,
		data: DonationAlertsUpdateMerchandiseData,
		rateLimiterOptions?: RateLimiterRequestOptions,
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
			end_at_ts: data.endTimestamp,
		};

		const signature = createSha256SignatureFromParams(formData, clientSecret);

		const response = await this._apiClient.callApi<DonationAlertsResponseSingleData<DonationAlertsMerchandiseData>>(
			user,
			{
				type: 'api',
				url: `merchandise/${merchandiseId}`,
				method: 'PUT',
				formBody: { ...formData, signature },
			},
			rateLimiterOptions,
		);

		return new DonationAlertsMerchandise(response.data);
	}

	/**
	 * Creates or updates a merchandise item.
	 *
	 * @remarks
	 * A versatile method that either updates an existing merchandise item or creates a new one if it doesn't
	 * already exist.
	 *
	 * @param user The ID of the user to use the access token of.
	 * @param clientSecret The application client secret.
	 * This secret must correspond to the application that the user authenticated.
	 * @param data The merchandise data to create or update.
	 * @param rateLimiterOptions Optional rate limiter configuration.
	 *
	 * @returns An instance of {@link DonationAlertsMerchandise} representing the created or updated merchandise item.
	 *
	 * @throws {@link HttpError} if the response status code falls outside the 200–299 range.
	 * @throws {@link UnregisteredUserError} if the specified user is not registered with the authentication provider.
	 */
	async createOrUpdateMerchandise(
		user: UserIdResolvable,
		clientSecret: string,
		data: DonationAlertsCreateMerchandiseData,
		rateLimiterOptions?: RateLimiterRequestOptions,
	): Promise<DonationAlertsMerchandise> {
		const formData = {
			title: data.title,
			is_active: mapOptional(data.isActive, (v: boolean) => (v ? '1' : '0')),
			is_percentage: mapOptional(data.isPercentage, (v: boolean) => (v ? '1' : '0')),
			currency: data.currency,
			price_user: data.priceUser,
			price_service: data.priceService,
			url: data.url,
			img_url: data.imageUrl,
			end_at_ts: data.endTimestamp,
		};

		const signature = createSha256SignatureFromParams(formData, clientSecret);

		const response = await this._apiClient.callApi<DonationAlertsResponseSingleData<DonationAlertsMerchandiseData>>(
			user,
			{
				type: 'api',
				url: `merchandise/${data.merchantIdentifier}/${data.merchandiseIdentifier}`,
				method: 'POST',
				formBody: { ...formData, signature },
			},
			rateLimiterOptions,
		);

		return new DonationAlertsMerchandise(response.data);
	}

	/**
	 * Sends a sale alert to DonationAlerts.
	 *
	 * @param user The ID of the authorized user.
	 * @param clientSecret The application client secret associated with the authorized application.
	 * @param data The sale alert data to send.
	 * @param rateLimiterOptions Optional rate limiter settings.
	 *
	 * @returns An instance of {@link DonationAlertsMerchandiseSale} representing the sale alert.
	 *
	 * @throws {@link HttpError} if the response status code is not in the 200-299 range.
	 * @throws {@link UnregisteredUserError} if the user is not registered in the authentication provider.
	 */
	async sendSaleAlert(
		user: UserIdResolvable,
		clientSecret: string,
		data: DonationAlertsSendMerchandiseSaleAlertData,
		rateLimiterOptions?: RateLimiterRequestOptions,
	): Promise<DonationAlertsMerchandiseSale> {
		const formData = {
			external_id: data.externalId,
			merchant_identifier: data.merchantIdentifier,
			merchandise_identifier: data.merchandiseIdentifier,
			amount: data.amount,
			currency: data.currency,
			boughtAmount: data.boughtAmount,
			username: data.username,
			message: data.message,
		};

		const signature = createSha256SignatureFromParams(formData, clientSecret);

		const response = await this._apiClient.callApi<
			DonationAlertsResponseSingleData<DonationAlertsMerchandiseSaleData>
		>(
			user,
			{
				type: 'api',
				url: 'merchandise_sale',
				method: 'POST',
				formBody: { ...formData, signature },
			},
			rateLimiterOptions,
		);

		return new DonationAlertsMerchandiseSale(response.data);
	}
}
