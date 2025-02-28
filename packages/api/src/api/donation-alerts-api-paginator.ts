import { type RateLimiterRequestOptions } from '@d-fischer/rate-limiter';
import { type DonationAlertsApiCallOptions } from '@donation-alerts/api-call';
import { ReadDocumentation, type UserIdResolvable } from '@donation-alerts/common';
import { type DonationAlertsResponseWithMeta } from './donation-alerts-response';
import { type ApiClient } from '../api-client';

/**
 * Donation Alerts API paginator.
 *
 * @remarks
 * A utility class for managing paginated responses from the Donation Alerts API.
 * This paginator supports navigating through paginated data by individual pages or fetching all data at once. It internally keeps track of the current page, total pages, and other metadata to simplify navigation.
 */
@ReadDocumentation('events')
export class DonationAlertsApiPaginator<D, T> {
	private _path?: string;
	private _currentPage?: number;
	private _totalPages?: number;
	private _from?: number;
	private _to?: number;
	private _perPage?: number;
	private _total?: number;

	private _currentData?: DonationAlertsResponseWithMeta<D>;
	private _isFinished: boolean = false;

	/** @internal */
	constructor(
		private readonly _api: ApiClient,
		private readonly _user: UserIdResolvable,
		private readonly _callOptions: DonationAlertsApiCallOptions,
		private readonly _mapper: (data: D) => T | T[],
		private readonly _rateLimiterOptions?: RateLimiterRequestOptions,
	) {}

	/**
	 * The current API endpoint path.
	 *
	 * @remarks
	 * This represents the path currently associated with the pagination request.
	 */
	get path(): string | undefined {
		return this._path;
	}

	/**
	 * The index of the first element in the currently fetched page.
	 */
	get from(): number | null | undefined {
		return this._from;
	}

	/**
	 * The index of the last element in the currently fetched page.
	 */
	get to(): number | null | undefined {
		return this._to;
	}

	/**
	 * The current page number.
	 *
	 * @remarks
	 * This value is updated after each retrieval of a specific page.
	 */
	get currentPage(): number | undefined {
		return this._currentPage;
	}

	/**
	 * The total number of pages.
	 */
	get totalPages(): number | undefined {
		return this._totalPages;
	}

	/**
	 * Number of items per page.
	 */
	get perPage(): number | undefined {
		return this._perPage;
	}

	/**
	 * The total number of items in the dataset.
	 */
	get total(): number | undefined {
		return this._total;
	}

	/**
	 * Indicates whether the paginator has reached the last page.
	 *
	 * @remarks
	 * When this flag is `true`, calling `getNext()` will return an empty array without making additional API requests.
	 */
	get isFinished(): boolean {
		return this._isFinished;
	}

	/**
	 * The raw data of the last retrieved page, including metadata.
	 *
	 * @returns The full API response for the most recently fetched page, or `undefined` if no request has been made yet.
	 */
	get rawData(): DonationAlertsResponseWithMeta<D> | undefined {
		return this._currentData;
	}

	/**
	 * Resets the paginator's internal state.
	 *
	 * @remarks
	 * After calling this method, the paginator will appear as if it has not yet fetched any data.
	 */
	reset(): void {
		this._isFinished = false;
		this._path = undefined;
		this._currentPage = undefined;
		this._totalPages = undefined;
		this._from = undefined;
		this._to = undefined;
		this._perPage = undefined;
		this._total = undefined;
	}

	/**
	 * Fetches and returns data from a specific page.
	 *
	 * @remarks
	 * If the requested page number exceeds the total number of pages, the method returns an empty array.
	 *
	 * @param page The page number to fetch. Defaults to `1`.
	 *
	 * @returns An array of mapped data objects for the requested page.
	 *
	 * @throws {@link HttpError} if the response status code is not within the `200-299` range.
	 * @throws {@link UnregisteredUserError} if the user is not registered in the authentication provider.
	 * @throws {@link MissingScopeError} if the access token does not include the required scope.
	 *
	 * @example
	 * ```ts
	 * const data = await paginator.getPage(42);
	 * ```
	 */
	async getPage(page: number = 1): Promise<T[]> {
		if (this._totalPages && page > this._totalPages) {
			return [];
		}

		const response = await this._fetchData(page);
		return this._processData(response);
	}

	/**
	 * Fetches the next page of data, or the first page if no pages have been loaded yet.
	 *
	 * @remarks
	 * This method automatically increments the page counter and checks the total number of pages to stop requests
	 * when the end is reached.
	 *
	 * @returns An array of mapped data objects for the next page, or an empty array if the last page is reached.
	 *
	 * @throws {@link HttpError} if the response status code is not within the `200-299` range.
	 * @throws {@link UnregisteredUserError} if the user is not registered in the authentication provider.
	 * @throws {@link MissingScopeError} if the access token does not include the required scope.
	 */
	async getNext(): Promise<T[]> {
		if (this._isFinished) {
			return [];
		}

		let page = 1;

		if (this._currentPage && this._totalPages) {
			if (this._currentPage >= this._totalPages) {
				this._isFinished = true;
				return [];
			}

			page = this._currentPage + 1;
		}

		const response = await this._fetchData(page);
		return this._processData(response);
	}

	/**
	 * Fetches the previous page of data.
	 *
	 * @remarks
	 * If the current page is `1`, this method will return data for the first page.
	 *
	 * @returns An array of mapped data objects for the previous page.
	 *
	 * @throws {@link HttpError} if the response status code is not within the `200-299` range.
	 * @throws {@link UnregisteredUserError} if the user is not registered in the authentication provider.
	 * @throws {@link MissingScopeError} if the access token does not include the required scope.
	 */
	async getPrev(): Promise<T[]> {
		let page = 1;

		if (this._currentPage && this._currentPage > 1) {
			page = this._currentPage - 1;
		}

		const response = await this._fetchData(page);
		return this._processData(response);
	}

	/**
	 * Fetches all pages and aggregates the results into a single array.
	 *
	 * @remarks
	 * This method resets the paginator at the start and end of the operation. It sequentially requests each page
	 * and concatenates the results.
	 *
	 * This method may take longer to execute, especially for users with a large volume of donations.
	 * For better performance with large datasets, consider using the {@link getNext} method to fetch data in chunks.
	 *
	 * @returns A combined array of all mapped data objects from all pages.
	 *
	 * @throws {@link HttpError} if the response status code is not within the `200-299` range.
	 * @throws {@link UnregisteredUserError} if the user is not registered in the authentication provider.
	 * @throws {@link MissingScopeError} if the access token does not include the required scope.
	 */
	async getAll(): Promise<T[]> {
		this.reset();
		const result: T[] = [];

		do {
			const data = await this.getNext();

			if (data.length === 0) {
				break;
			}

			result.push(...data);
		} while (!this._isFinished);

		this.reset();
		return result;
	}

	/**
	 * Enables asynchronous iteration over all available pages.
	 *
	 * @throws {@link HttpError} if the response status code is not within the `200-299` range.
	 * @throws {@link UnregisteredUserError} if the user is not registered in the authentication provider.
	 * @throws {@link MissingScopeError} if the access token does not include the required scope.
	 *
	 * @example
	 * ```ts
	 * const paginator = apiClient.donations.createDonationsPaginator();
	 *
	 * for await (const pageData of paginator) {
	 *   console.log(pageData);
	 * }
	 * ```
	 */
	async *[Symbol.asyncIterator](): AsyncGenerator<T[], void, undefined> {
		this.reset();

		while (!this._isFinished) {
			const data = await this.getNext();

			if (data.length === 0) {
				break;
			}

			yield data;
		}
	}

	private async _fetchData(page: number): Promise<DonationAlertsResponseWithMeta<D>> {
		return await this._api.callApi<DonationAlertsResponseWithMeta<D>>(
			this._user,
			{
				query: { page },
				...this._callOptions,
			},
			this._rateLimiterOptions,
		);
	}

	private _processData(data: DonationAlertsResponseWithMeta<D>): T[] {
		if (data.meta.current_page >= data.meta.last_page) {
			this._isFinished = true;
		}

		this._currentPage = data.meta.current_page;
		this._currentData = data;
		this._path = data.meta.path;
		this._from = data.meta.from;
		this._to = data.meta.to;
		this._totalPages = data.meta.last_page;
		this._perPage = data.meta.per_page;
		this._total = data.meta.total;

		if (this._currentPage > this._totalPages) {
			return [];
		}

		return data.data.reduce((acc: T[], elem: D) => {
			const mapped = this._mapper(elem);
			return Array.isArray(mapped) ? [...acc, ...mapped] : [...acc, mapped];
		}, []);
	}
}
