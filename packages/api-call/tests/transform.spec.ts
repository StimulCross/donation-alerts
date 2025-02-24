import { describe, expect, it } from 'vitest';
import { handleDonationAlertsApiResponseError, HttpError, transformDonationAlertsResponse } from '../src';

class MockResponse {
	constructor(
		private body: string,
		public status: number,
		public statusText: string,
		private headersMap: Record<string, string>,
		public ok: boolean,
	) {}

	async text(): Promise<string> {
		return this.body;
	}

	async json(): Promise<any> {
		return JSON.parse(this.body);
	}

	headers = {
		get: (header: string): string | null => this.headersMap[header] || null,
	};
}

describe('handleDonationAlertsApiResponseError', () => {
	it('should throw HttpError when response is not ok and content-type is application/json', async () => {
		const jsonBody = JSON.stringify({ error: 'Some error' });
		const response = new MockResponse(jsonBody, 400, 'Bad Request', { 'Content-Type': 'application/json' }, false);
		const options = { url: '/api/test', query: { a: 1 }, method: 'GET' } as any;

		await expect(handleDonationAlertsApiResponseError(response as any, options)).rejects.toThrow(HttpError);
	});

	it('should throw HttpError with text body when response is not ok and content-type is not application/json', async () => {
		const plainText = 'Plain error text';
		const response = new MockResponse(
			plainText,
			500,
			'Internal Server Error',
			{ 'Content-Type': 'text/plain' },
			false,
		);
		const options = { url: '/api/test', query: { b: 'test' }, method: 'POST' } as any;

		try {
			await handleDonationAlertsApiResponseError(response as any, options);
		} catch (e: any) {
			expect(e).toBeInstanceOf(HttpError);
			expect(e.status).toBe(500);
			expect(e.statusText).toBe('Internal Server Error');
			expect(e.url).toContain('/api/test');
			expect(e.method).toBe('POST');
			expect(e.body).toBe(plainText);
		}
	});
});

describe('transformDonationAlertsResponse', () => {
	it('should return undefined for response with status 204', async () => {
		const response = new MockResponse('', 204, 'No Content', {}, true);
		const result = await transformDonationAlertsResponse(response as any);
		expect(result).toBeUndefined();
	});

	it('should return undefined when response text is empty', async () => {
		const response = new MockResponse('', 200, 'OK', {}, true);
		const result = await transformDonationAlertsResponse(response as any);
		expect(result).toBeUndefined();
	});

	it('should parse and return JSON when response has valid text', async () => {
		const data = { success: true };
		const response = new MockResponse(JSON.stringify(data), 200, 'OK', {}, true);
		const result = await transformDonationAlertsResponse(response as any);
		expect(result).toEqual(data);
	});
});
