import { CustomError } from '@donation-alerts/common';

export class HttpError extends CustomError {
	/** @internal */
	constructor(
		private readonly _statusCode: number,
		statusText: string,
		private readonly _url: string,
		private readonly _method: string,
		private readonly _body: string,
		isJson: boolean,
	) {
		super(
			`Encountered HTTP status code ${_statusCode}: ${statusText}\n\nURL: ${_url}\nMethod: ${_method}\nBody:\n${
				!isJson && _body.length > 150 ? `${_body.slice(0, 147)}...` : _body
			}`,
		);
	}

	get statusCode(): number {
		return this._statusCode;
	}

	get url(): string {
		return this._url;
	}

	get method(): string {
		return this._method;
	}

	get body(): string {
		return this._body;
	}
}
