import {
	DataObject,
	rawDataSymbol,
	ReadDocumentation,
	type DonationAlertsLocaleCode,
	type DonationAlertsOutputCurrency,
} from '@donation-alerts/common';
import { mapNullable } from '@stimulcross/shared-utils';
import { Memoize } from 'typescript-memoize';
import {
	DonationAlertsMerchandiseMerchant,
	type DonationAlertsMerchandiseMerchantData,
} from './donation-alerts-merchandise-merchant';

/**
 * Object carrying merchandise's titles in different locales.
 */
export interface DonationAlertsMerchandiseTitleData extends Partial<Record<DonationAlertsLocaleCode, string>> {
	en_US: string;
}

/** @internal */
export interface DonationAlertsMerchandiseData {
	id: number;
	merchant: DonationAlertsMerchandiseMerchantData;
	identifier: string;
	title: DonationAlertsMerchandiseTitleData;
	is_active: 0 | 1;
	is_percentage: 0 | 1;
	currency: DonationAlertsOutputCurrency;
	price_user: number;
	price_service: number;
	url: string | null;
	img_url: string | null;
	end_at: string | null;
}

/**
 * Represents Donation Alerts merchandise.
 */
@ReadDocumentation('api')
export class DonationAlertsMerchandise extends DataObject<DonationAlertsMerchandiseData> {
	/**
	 * Unique merchandise ID on DonationAlerts.
	 */
	get id(): number {
		return this[rawDataSymbol].id;
	}

	/**
	 * Object carrying `identifier` and `name` fields that contain information about the merchant.
	 */
	@Memoize()
	get merchant(): DonationAlertsMerchandiseMerchant {
		return new DonationAlertsMerchandiseMerchant(this[rawDataSymbol].merchant);
	}

	/**
	 * Unique merchandise ID on the merchant's online store.
	 */
	get identifier(): string {
		return this[rawDataSymbol].identifier;
	}

	/**
	 * Object carrying merchandise's titles in different locales.
	 */
	get title(): DonationAlertsMerchandiseTitleData {
		return this[rawDataSymbol].title;
	}

	/**
	 * Whether the merchandise is available for purchase or not.
	 */
	get isActive(): boolean {
		return this[rawDataSymbol].is_active === 1;
	}

	/**
	 * Whether the `priceService` and `priceUser` parameters should be recognized as absolute values of the currency or
	 * as a percent of the sale's total.
	 */
	get isPercentage(): boolean {
		return this[rawDataSymbol].is_percentage === 1;
	}

	/**
	 * The currency code of the merchandise (ISO 4217 formatted).
	 */
	get currency(): DonationAlertsOutputCurrency {
		return this[rawDataSymbol].currency;
	}

	/**
	 * Amount of revenue added to streamer for each sale of the merchandise.
	 */
	get priceUser(): number {
		return this[rawDataSymbol].price_user;
	}

	/**
	 * Amount of revenue added to DonationAlerts for each sale of the merchandise.
	 */
	get priceService(): number {
		return this[rawDataSymbol].price_service;
	}

	/**
	 * URL to the merchandise's web page. Or `null` if URL is not set.
	 */
	get url(): string | null {
		return this[rawDataSymbol].url;
	}

	/**
	 * URL to the merchandise's image. Or `null` if image is not set.
	 */
	get imageUrl(): string | null {
		return this[rawDataSymbol].img_url;
	}

	/**
	 * Date and time indicating when the merchandise becomes inactive. Or `null` if end date is not set.
	 */
	get endDate(): Date | null {
		return mapNullable(this[rawDataSymbol].end_at, (v: string) => new Date(v));
	}
}
