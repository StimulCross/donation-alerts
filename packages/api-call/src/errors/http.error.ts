import { CustomError } from '@donation-alerts/common';

/**
 * Represents an HTTP-related error.
 *
 * @remarks
 * This error is thrown whenever an HTTP request encounters a non-successful HTTP status code.
 * It includes detailed information about the request, including the status code, status text,
 * URL, HTTP method, and response body.
 *
 * The `HttpError` class masks lengthy non-JSON response bodies for readability
 * in the error message.
 */
export class HttpError extends CustomError {
	/** @internal */
	constructor(
		private readonly _status: number,
		private readonly _statusText: string,
		private readonly _url: string,
		private readonly _method: string,
		private readonly _body: string,
		isJson: boolean,
	) {
		super(
			`Encountered HTTP status code ${_status}: ${_statusText}\n\nURL: ${_url}\nMethod: ${_method}\nBody:\n${
				!isJson && _body.length > 150 ? `${_body.slice(0, 147)}...` : _body
			}`,
		);
	}

	/**
	 * The HTTP status code of the error.
	 */
	get status(): number {
		return this._status;
	}

	/**
	 * The HTTP status text associated with the error.
	 */
	get statusText(): string {
		return this._statusText;
	}

	/**
	 * The URL of the request that caused the error.
	 */
	get url(): string {
		return this._url;
	}

	/**
	 * The HTTP method used in the request.
	 */
	get method(): string {
		return this._method;
	}

	/**
	 * The response body of the request.
	 *
	 * @remarks
	 * If the response body was excessively long (and not JSON), it might be truncated
	 * in the error message for readability. Use this property to access the full
	 * response body if needed.
	 */
	get body(): string {
		return this._body;
	}
}
