import { type RateLimiterRequestOptions } from '@d-fischer/rate-limiter';
import { type DonationAlertsApiCallOptions } from '@donation-alerts/api-call';
import { ReadDocumentation, type UserIdResolvable } from '@donation-alerts/common';
import { type DonationAlertsResponseWithMeta } from './DonationAlertsResponse';
import { type ApiClient } from '../ApiClient';

/**
 * Donation Alerts API paginator.
 *
 * Allows fetching data by page, or all at once.
 */
@ReadDocumentation('events')
export class DonationAlertsApiPaginator<D, T> {
	private _path?: string;
	private _currentPage?: number;
	private _totalPages?: number;
	private _from?: number | null;
	private _to?: number | null;
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
		private readonly _rateLimiterOptions?: RateLimiterRequestOptions
	) {}

	/**
	 * The current path.
	 */
	get path(): string | undefined {
		return this._path;
	}

	/**
	 * The first element index.
	 */
	get from(): number | null | undefined {
		return this._from;
	}

	/**
	 * The last element index.
	 */
	get to(): number | null | undefined {
		return this._to;
	}

	/**
	 * The current page number.
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
	 * Total numbers of entities.
	 */
	get total(): number | undefined {
		return this._total;
	}

	/**
	 * Whether the paginator reached the last page.
	 */
	get isFinished(): boolean {
		return this._isFinished;
	}

	/**
	 * Gets a raw data of the last retrieved page.
	 */
	get rawData(): DonationAlertsResponseWithMeta<D> | undefined {
		return this._currentData;
	}

	/**
	 * Resets the current state of the paginator.
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
	 * Gets donations by page number.
	 *
	 * Returns empty array if the requested page is greater than the last page.
	 *
	 * @param page Page number to request. Default is `1`.
	 *
	 * @throws {@link HttpError} if response status code is out of 200-299 range.
	 * @throws {@link UnregisteredUserError} if the user you are trying to get is not registered in authentication provider.
	 * @throws {@link MissingScopeError} if the access token does not have required scope.
	 */
	async getPage(page: number = 1): Promise<T[]> {
		if (this._totalPages && page > this._totalPages) {
			return [];
		}

		const response = await this._fetchData(page);
		return this._processData(response);
	}

	/**
	 * Gets the next or the first page of donations.
	 *
	 * Returns an empty array if the last page is reached.
	 *
	 * @throws {@link HttpError} if response status code is out of 200-299 range.
	 * @throws {@link UnregisteredUserError} if the user you are trying to get is not registered in authentication provider.
	 * @throws {@link MissingScopeError} if the access token does not have required scope.
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
	 * Gets the previous page of donations.
	 *
	 * If the current page number is `1`, then it returns it back.
	 *
	 * @throws {@link HttpError} if response status code is out of 200-299 range.
	 * @throws {@link UnregisteredUserError} if the user you are trying to get is not registered in authentication provider.
	 * @throws {@link MissingScopeError} if the access token does not have required scope.
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
	 * Gets all donations.
	 *
	 * @throws {@link HttpError} if response status code is out of 200-299 range.
	 * @throws {@link UnregisteredUserError} if the user you are trying to get is not registered in authentication provider.
	 * @throws {@link MissingScopeError} if the access token does not have required scope.
	 */
	async getAll(): Promise<T[]> {
		this.reset();
		const result: T[] = [];

		do {
			const data = await this.getNext();
			if (!data.length) {
				break;
			}

			result.push(...data);
		} while (!this._isFinished);

		this.reset();
		return result;
	}

	/**
	 * Makes it possible to use async iterator to sequentially loop over all available pages.
	 *
	 * @example
	 * const apiClient = new ApiClient({ ...config });
	 * const paginator = apiClient.donations.createDonationsPaginator();
	 *
	 * for await (const data of paginator) {
	 *   ...
	 * }
	 *
	 * @throws {@link HttpError} if response status code is out of 200-299 range.
	 * @throws {@link UnregisteredUserError} if the user you are trying to get is not registered in authentication provider.
	 * @throws {@link MissingScopeError} if the access token does not have required scope.
	 */
	async *[Symbol.asyncIterator](): AsyncGenerator<T[], void, undefined> {
		this.reset();

		while (!this._isFinished) {
			const data = await this.getNext();
			if (!data.length) {
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
				...this._callOptions
			},
			this._rateLimiterOptions
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
