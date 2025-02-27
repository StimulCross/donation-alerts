import { AccessToken, getExpiryMilliseconds, getTokenExpiryDate, isAccessTokenExpired } from '../src/access-token';

describe('getExpiryMilliseconds', () => {
	it('should return the correct expiry milliseconds when expiresIn is provided', () => {
		const now = Date.now();
		const token: AccessToken = {
			accessToken: 'test-token',
			refreshToken: 'test-refresh',
			expiresIn: 3600, // 1 hour
			obtainmentTimestamp: now,
			scopes: ['scope1'],
		};

		const expected = now + 3600 * 1000;
		const result = getExpiryMilliseconds(token);
		expect(result).toBe(expected);
	});

	it('should return null when expiresIn is null', () => {
		const now = Date.now();
		const token: AccessToken = {
			accessToken: 'test-token',
			refreshToken: 'test-refresh',
			expiresIn: null,
			obtainmentTimestamp: now,
			scopes: ['scope1'],
		};

		const result = getExpiryMilliseconds(token);
		expect(result).toBeNull();
	});
});

describe('getTokenExpiryDate', () => {
	it('should return a Date object representing the expiry time when expiresIn is provided', () => {
		const now = Date.now();
		const token: AccessToken = {
			accessToken: 'test-token',
			refreshToken: 'test-refresh',
			expiresIn: 3600,
			obtainmentTimestamp: now,
			scopes: ['scope1'],
		};

		const expiryMs = now + 3600 * 1000;
		const expectedDate = new Date(expiryMs);
		const result = getTokenExpiryDate(token);
		expect(result).toEqual(expectedDate);
	});

	it('should return null when expiresIn is null', () => {
		const now = Date.now();
		const token: AccessToken = {
			accessToken: 'test-token',
			refreshToken: 'test-refresh',
			expiresIn: null,
			obtainmentTimestamp: now,
			scopes: ['scope1'],
		};

		const result = getTokenExpiryDate(token);
		expect(result).toBeNull();
	});
});

describe('isAccessTokenExpired', () => {
	it('should return true if the access token is expired', () => {
		const pastTime = Date.now() - 3600 * 1000; // 1 hour ago
		const token: AccessToken = {
			accessToken: 'test-token',
			refreshToken: 'test-refresh',
			expiresIn: 10, // expired after 10 seconds
			obtainmentTimestamp: pastTime,
			scopes: ['scope1'],
		};

		expect(isAccessTokenExpired(token)).toBe(true);
	});

	it('should return false if the access token is not expired', () => {
		const now = Date.now();
		const token: AccessToken = {
			accessToken: 'test-token',
			refreshToken: 'test-refresh',
			expiresIn: 3600, // 1 hour
			obtainmentTimestamp: now,
			scopes: ['scope1'],
		};

		expect(isAccessTokenExpired(token)).toBe(false);
	});

	it('should return false if expiresIn is null', () => {
		const now = Date.now();
		const token: AccessToken = {
			accessToken: 'test-token',
			refreshToken: 'test-refresh',
			expiresIn: null,
			obtainmentTimestamp: now,
			scopes: ['scope1'],
		};

		expect(isAccessTokenExpired(token)).toBe(false);
	});
});
