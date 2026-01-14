/** @internal */
export interface DonationAlertsResponseData<T = unknown> {
	data: T[];
}

/** @internal */
export interface DonationAlertsResponseSingleData<T = unknown> {
	data: T;
}

/** @internal */
export interface DonationAlertsResponseLinksData {
	first: string;
	last: string;
	prev: string | null;
	next: string | null;
}

/** @internal */
export interface DonationAlertsResponseMetaData {
	current_page: number;
	from: number;
	last_page: number;
	path: string;
	per_page: number;
	to: number;
	total: number;
}

/** @internal */
export interface DonationAlertsResponseWithMeta<T = unknown> extends DonationAlertsResponseData<T> {
	links: DonationAlertsResponseLinksData;
	meta: DonationAlertsResponseMetaData;
}
