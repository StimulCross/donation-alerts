import { describe, it, expect } from 'vitest';
import { getDonationAlertsApiUrl } from '../src/utils/det-donation-alerts-api-url.js';

describe('getDonationAlertsApiUrl', () => {
	it('should return API URL for type "api" when path starts with slash', () => {
		const url = '/endpoint';
		const result = getDonationAlertsApiUrl(url, 'api');

		expect(result).toBe('https://www.donationalerts.com/api/v1/endpoint');
	});

	it('should return API URL for type "api" when path does not start with slash', () => {
		const url = 'endpoint';
		const result = getDonationAlertsApiUrl(url, 'api');

		expect(result).toBe('https://www.donationalerts.com/api/v1/endpoint');
	});

	it('should return OAuth URL for type "auth" when path starts with slash', () => {
		const url = '/login';
		const result = getDonationAlertsApiUrl(url, 'auth');

		expect(result).toBe('https://www.donationalerts.com/oauth/login');
	});

	it('should return OAuth URL for type "auth" when path does not start with slash', () => {
		const url = 'login';
		const result = getDonationAlertsApiUrl(url, 'auth');

		expect(result).toBe('https://www.donationalerts.com/oauth/login');
	});

	it('should return original URL for type "custom"', () => {
		const url = 'https://custom.domain.com/path';
		const result = getDonationAlertsApiUrl(url, 'custom');

		expect(result).toBe(url);
	});

	it('should return original URL for unknown type', () => {
		const url = 'https://example.com/';
		// @ts-expect-error invalid type
		const result = getDonationAlertsApiUrl(url, 'unknown');

		expect(result).toBe(url);
	});
});
