import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { callDonationAlertsApi, callDonationAlertsApiRaw, type DonationAlertsApiCallOptions } from '../src/index.js';

describe('callDonationAlertsApiRaw', () => {
	let fetchCalls: Array<[RequestInfo, RequestInit | undefined]>;

	beforeEach(() => {
		fetchCalls = [];

		vi.stubGlobal(
			'fetch',
			vi.fn(async (input: RequestInfo, init?: RequestInit): Promise<Response> => {
				fetchCalls.push([input, init]);

				return {
					ok: true,
					status: 200,
					text: async () => '{"result":"ok"}',
					headers: new Headers({ 'Content-Type': 'application/json' }),
				} as Response;
			}),
		);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('should call fetch with proper options when jsonBody is provided', async () => {
		const options: DonationAlertsApiCallOptions = {
			url: '/test-endpoint',
			type: 'api',
			method: 'POST',
			query: { foo: 'bar' },
			jsonBody: { data: 123 },
		};

		const accessToken = 'test-token';

		await callDonationAlertsApiRaw(options, accessToken);

		expect(fetchCalls).toHaveLength(1);

		const [url, requestOptions] = fetchCalls[0];

		expect(url).toBe('https://www.donationalerts.com/api/v1/test-endpoint?foo=bar');
		expect(requestOptions?.method).toBe('POST');
		expect(requestOptions?.body).toBe(JSON.stringify(options.jsonBody));

		const headers = requestOptions?.headers as Headers;

		expect(headers.get('Accept')).toBe('application/json');
		expect(headers.get('Content-Type')).toBe('application/json');
		expect(headers.get('Authorization')).toBe(`Bearer ${accessToken}`);
	});

	it('should call fetch with proper options when formBody is provided', async () => {
		const options: DonationAlertsApiCallOptions = {
			url: '/form-endpoint',
			type: 'api',
			method: 'POST',
			query: { foo: 'bar' },
			formBody: { key: 'value' },
		};

		await callDonationAlertsApiRaw(options);

		expect(fetchCalls).toHaveLength(1);

		const [url, requestOptions] = fetchCalls[0];

		expect(url).toBe('https://www.donationalerts.com/api/v1/form-endpoint?foo=bar');
		expect(requestOptions?.body).toBe('key=value');

		const headers = requestOptions?.headers as Headers;

		expect(headers.get('Content-Type')).toBe('application/x-www-form-urlencoded');
		expect(headers.get('Accept')).toBe('application/json');
	});

	it('should set body to null when neither jsonBody nor formBody is provided', async () => {
		const options: DonationAlertsApiCallOptions = {
			url: '/no-body-endpoint',
			type: 'api',
			query: { a: '1' },
		};

		await callDonationAlertsApiRaw(options);

		const [, requestOptions] = fetchCalls[0];

		expect(requestOptions?.body).toBeUndefined();
	});
});

describe('callDonationAlertsApi', () => {
	beforeEach(() => {
		vi.stubGlobal(
			'fetch',
			vi.fn(
				async (): Promise<Response> =>
					({
						ok: true,
						status: 200,
						text: async () => '{"result":"1"}',
						headers: new Headers({ 'Content-Type': 'application/json' }),
					}) as Response,
			),
		);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('should process API call and return parsed JSON result', async () => {
		const expectedData = { result: '1' };

		const options: DonationAlertsApiCallOptions = {
			url: '/test-endpoint',
			type: 'api',
			query: { foo: 'bar' },
			method: 'GET',
		};

		const result = await callDonationAlertsApi<typeof expectedData>(options);

		expect(result).toEqual(expectedData);
	});
});
