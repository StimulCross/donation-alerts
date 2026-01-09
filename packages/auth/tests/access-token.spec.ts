import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
	type AccessToken,
	getExpiryMilliseconds,
	getTokenExpiryDate,
	isAccessTokenExpired,
} from '../src/access-token.js';

describe('getExpiryMilliseconds', () => {
	it('should return correct expiry timestamp in milliseconds', () => {
		const now = Date.now();

		const token: AccessToken = {
			accessToken: 'test-token',
			refreshToken: 'test-refresh',
			expiresIn: 3600,
			obtainmentTimestamp: now,
			scopes: ['scope1'],
		};

		const result = getExpiryMilliseconds(token);

		expect(result).toBe(now + 3600 * 1000);
	});
});

describe('getTokenExpiryDate', () => {
	it('should return Date representing token expiry time', () => {
		const now = Date.now();

		const token: AccessToken = {
			accessToken: 'test-token',
			refreshToken: 'test-refresh',
			expiresIn: 3600,
			obtainmentTimestamp: now,
			scopes: ['scope1'],
		};

		const result = getTokenExpiryDate(token);

		expect(result).toEqual(new Date(now + 3600 * 1000));
		expect(result).toBeInstanceOf(Date);
	});
});

describe('isAccessTokenExpired', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('should return true when access token is expired', () => {
		const now = Date.now();
		vi.setSystemTime(now);

		const token: AccessToken = {
			accessToken: 'test-token',
			refreshToken: 'test-refresh',
			expiresIn: 10,
			obtainmentTimestamp: now - 60_000,
			scopes: ['scope1'],
		};

		expect(isAccessTokenExpired(token)).toBe(true);
	});

	it('should return false when access token is not expired', () => {
		const now = Date.now();
		vi.setSystemTime(now);

		const token: AccessToken = {
			accessToken: 'test-token',
			refreshToken: 'test-refresh',
			expiresIn: 3600,
			obtainmentTimestamp: now,
			scopes: ['scope1'],
		};

		expect(isAccessTokenExpired(token)).toBe(false);
	});
});
