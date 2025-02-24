import { describe, it, expect } from 'vitest';
import { getDonationAlertsApiUrl } from '../src/helpers/url';

describe('getDonationAlertsApiUrl', () => {
	it('should return API URL for type "api" without leading slash in path', () => {
		const url = '/endpoint';
		const result = getDonationAlertsApiUrl(url, 'api');
		expect(result).toBe('https://www.donationalerts.com/api/v1/endpoint');
	});

	it('should return API URL for type "api" with path not starting with slash', () => {
		const url = 'endpoint';
		const result = getDonationAlertsApiUrl(url, 'api');
		expect(result).toBe('https://www.donationalerts.com/api/v1/endpoint');
	});

	it('should return OAuth URL for type "auth" without leading slash in path', () => {
		const url = '/login';
		const result = getDonationAlertsApiUrl(url, 'auth');
		expect(result).toBe('https://www.donationalerts.com/oauth/login');
	});

	it('should return OAuth URL for type "auth" with path not starting with slash', () => {
		const url = 'login';
		const result = getDonationAlertsApiUrl(url, 'auth');
		expect(result).toBe('https://www.donationalerts.com/oauth/login');
	});

	it('should return the original URL for type "custom"', () => {
		const url = 'https://custom.domain.com/path';
		const result = getDonationAlertsApiUrl(url, 'custom');
		expect(result).toBe(url);
	});

	it('should return the original URL for unknown type using default case', () => {
		const url = 'https://example.com/';
		const result = getDonationAlertsApiUrl(url, 'unknown' as any);
		expect(result).toBe(url);
	});
});
