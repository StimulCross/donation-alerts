import { type ApiClient } from '../api-client.js';

/** @internal */
export abstract class BaseApi {
	/** @internal */
	protected readonly _apiClient: ApiClient;

	/** @internal */
	constructor(client: ApiClient) {
		this._apiClient = client;
	}
}
