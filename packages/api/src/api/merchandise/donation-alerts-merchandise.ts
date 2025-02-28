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
 *
 * @remarks
 * This class provides detailed information about Donation Alerts merchandise items, such as
 * the associated merchant, pricing details, availability status, and localized titles.
 * It parses and exposes raw data provided by the Donation Alerts API for ease of use.
 */
@ReadDocumentation('api')
export class DonationAlertsMerchandise extends DataObject<DonationAlertsMerchandiseData> {
	/**
	 * Unique merchandise ID on Donation Alerts.
	 */
	get id(): number {
		return this[rawDataSymbol].id;
	}

	/**
	 * Information about the merchant associated with the merchandise.
	 *
	 * @returns An instance of {@link DonationAlertsMerchandiseMerchant} containing merchant details.
	 */
	@Memoize()
	get merchant(): DonationAlertsMerchandiseMerchant {
		return new DonationAlertsMerchandiseMerchant(this[rawDataSymbol].merchant);
	}

	/**
	 * Unique ID of the merchandise on the merchant's platform.
	 *
	 * @remarks
	 * This identifier is set by the merchant and is unique to their platform or online store.
	 *
	 * @returns The merchant's unique merchandise ID as a string.
	 */
	get identifier(): string {
		return this[rawDataSymbol].identifier;
	}

	/**
	 * Merchandise titles in different locales.
	 *
	 * @remarks
	 * Provides titles for the merchandise across supported locales, including a mandatory
	 * `en_US` title field.
	 *
	 * @returns A {@link DonationAlertsMerchandiseTitleData} object containing localized titles for the merchandise
	 * as values.
	 */
	get title(): DonationAlertsMerchandiseTitleData {
		return this[rawDataSymbol].title;
	}

	/**
	 * Availability status of the merchandise.
	 *
	 * @remarks
	 * Indicates whether the merchandise is active and available for purchase.
	 *
	 * @returns `true` if the merchandise is active; otherwise `false`.
	 */
	get isActive(): boolean {
		return this[rawDataSymbol].is_active === 1;
	}

	/**
	 * Pricing mode for the merchandise.
	 *
	 * @remarks
	 * Indicates whether the revenue (`priceUser` and `priceService`)
	 * is calculated as an absolute amount or a percentage of the total.
	 *
	 * @returns `true` if pricing is percentage-based; otherwise `false`.
	 */
	get isPercentage(): boolean {
		return this[rawDataSymbol].is_percentage === 1;
	}

	/**
	 * The currency used for merchandise prices.
	 *
	 * @remarks
	 * Provides the ISO 4217-formatted currency code for the merchandise prices.
	 *
	 * @returns The currency code as a string.
	 */
	get currency(): DonationAlertsOutputCurrency {
		return this[rawDataSymbol].currency;
	}

	/**
	 * Revenue added to the streamer for each sale of the merchandise.
	 *
	 * @remarks
	 * Shows the amount of money the streamer earns from each sale of the merchandise.
	 *
	 * @returns The revenue amount as a number.
	 */
	get priceUser(): number {
		return this[rawDataSymbol].price_user;
	}

	/**
	 * Revenue added to Donation Alerts for each sale of the merchandise.
	 *
	 * @remarks
	 * Reflects the commission or revenue that Donation Alerts earns per sale.
	 *
	 * @returns The revenue amount as a number.
	 */
	get priceService(): number {
		return this[rawDataSymbol].price_service;
	}

	/**
	 * URL to the merchandise's web page.
	 *
	 * @remarks
	 * If the merchandise does not have a web page, `null` is returned.
	 *
	 * @returns The URL as a string, or `null` if not set.
	 */
	get url(): string | null {
		return this[rawDataSymbol].url;
	}

	/**
	 * URL to the merchandise's image.
	 *
	 * @remarks
	 * If no image is set, `null` is returned.
	 *
	 * @returns The URL to the image as a string, or `null` if not set.
	 */
	get imageUrl(): string | null {
		return this[rawDataSymbol].img_url;
	}

	/**
	 * Merchandising end date.
	 *
	 * @remarks
	 * The date and time at which the merchandise becomes inactive and
	 * unavailable for purchase.
	 *
	 * If no end date is set, `null` is returned.
	 *
	 * @returns A `Date` object indicating the end date, or `null` if not set.
	 */
	get endDate(): Date | null {
		return mapNullable(this[rawDataSymbol].end_at, (v: string) => new Date(v));
	}
}
