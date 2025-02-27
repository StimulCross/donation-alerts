import { callDonationAlertsApi, callDonationAlertsApiRaw, type DonationAlertsApiCallOptions } from '../src';

const originalFetch = globalThis.fetch;

describe('callDonationAlertsApiRaw', () => {
	let fetchMock: ReturnType<typeof jest.fn>;

	beforeEach(() => {
		fetchMock = jest.fn().mockResolvedValue({
			ok: true,
			status: 200,
			text: async () => '{"result": "ok"}',
			headers: new Headers({ 'Content-Type': 'application/json' }),
		});
		globalThis.fetch = fetchMock as typeof globalThis.fetch;
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
		jest.clearAllMocks();
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

		expect(fetchMock).toHaveBeenCalledTimes(1);
		const expectedUrl = 'https://www.donationalerts.com/api/v1/test-endpoint?foo=bar';
		const fetchCallArgs = fetchMock.mock.lastCall;
		expect(fetchCallArgs![0]).toBe(expectedUrl);

		const requestOptions: RequestInit = fetchCallArgs![1];
		expect(requestOptions.method).toBe('POST');
		expect(requestOptions.body).toBe(JSON.stringify(options.jsonBody));

		const headers = requestOptions.headers as Headers;
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

		expect(fetchMock).toHaveBeenCalledTimes(1);
		const expectedUrl = 'https://www.donationalerts.com/api/v1/form-endpoint?foo=bar';
		const fetchCallArgs = fetchMock.mock.lastCall;
		expect(fetchCallArgs![0]).toBe(expectedUrl);

		const requestOptions: RequestInit = fetchCallArgs![1];
		expect(requestOptions.body).toBe('key=value');
		const headers = requestOptions.headers as Headers;
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

		const fetchCallArgs = fetchMock.mock.lastCall;
		const requestOptions: RequestInit = fetchCallArgs![1];
		expect(requestOptions.body).toBeNull();
	});
});

describe('callDonationAlertsApi', () => {
	let fetchMock: ReturnType<typeof jest.fn>;

	beforeEach(() => {
		fetchMock = jest.fn().mockResolvedValue({
			ok: true,
			status: 200,
			text: async () => '{"result":"1"}',
			headers: new Headers({ 'Content-Type': 'application/json' }),
		});
		globalThis.fetch = fetchMock as typeof globalThis.fetch;
		jest.clearAllMocks();
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
	});

	it('should process API call with transform functions', async () => {
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
