import { nonenumerable } from '@stimulcross/shared-utils';
import { type ApiClient } from '../ApiClient';

/** @internal */
export abstract class BaseApi {
	/** @internal */
	@nonenumerable protected readonly _apiClient: ApiClient;

	/** @internal */
	constructor(client: ApiClient) {
		this._apiClient = client;
	}
}
