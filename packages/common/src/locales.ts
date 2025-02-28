/**
 * Supported locale codes by Donation Alerts API.
 */
export type DonationAlertsLocaleCode =
	| 'be_BY'
	| 'de_DE'
	| 'en_US'
	| 'es_ES'
	| 'es_US'
	| 'et_EE'
	| 'fr_FR'
	| 'he_HE'
	| 'it_IT'
	| 'ka_GE'
	| 'kk_KZ'
	| 'ko_KR'
	| 'lv_LV'
	| 'pl_PL'
	| 'pt_BR'
	| 'ru_RU'
	| 'sv_SE'
	| 'tr_TR'
	| 'uk_UA'
	| 'zh_CN';

/**
 * Represents a locale supported by Donation Alerts API with its code and human-readable name.
 */
export interface DonationAlertsLocale {
	/**
	 * The locale code following the pattern language_REGION (for example, `en_US` for English in the USA).
	 */
	code: DonationAlertsLocaleCode;

	/**
	 * A human-readable name for the locale.
	 */
	name: string;
}

/**
 * A collection of supported locales by the Donation Alerts API.
 *
 * @remarks
 * Each locale is defined by a unique `code` and a corresponding human-readable `name`.
 */
export const locales: DonationAlertsLocale[] = [
	{
		code: 'be_BY',
		name: 'Belarusian',
	},
	{
		code: 'de_DE',
		name: 'German',
	},
	{
		code: 'en_US',
		name: 'English (USA)',
	},
	{
		code: 'es_ES',
		name: 'Spanish',
	},
	{
		code: 'es_US',
		name: 'Spanish (USA)',
	},
	{
		code: 'et_EE',
		name: 'Estonian',
	},
	{
		code: 'fr_FR',
		name: 'French',
	},
	{
		code: 'he_HE',
		name: 'Hebrew',
	},
	{
		code: 'it_IT',
		name: 'Italian',
	},
	{
		code: 'ka_GE',
		name: 'Georgian',
	},
	{
		code: 'kk_KZ',
		name: 'Kazakh',
	},
	{
		code: 'ko_KR',
		name: 'Korean',
	},
	{
		code: 'lv_LV',
		name: 'Latvian',
	},
	{
		code: 'pl_PL',
		name: 'Polish',
	},
	{
		code: 'pt_BR',
		name: 'Portuguese (Brazil)',
	},
	{
		code: 'ru_RU',
		name: 'Russian',
	},
	{
		code: 'sv_SE',
		name: 'Swedish',
	},
	{
		code: 'tr_TR',
		name: 'Turkish',
	},
	{
		code: 'uk_UA',
		name: 'Ukrainian',
	},
	{
		code: 'zh_CN',
		name: 'Chinese',
	},
];
