import { callDonationAlertsApi } from '@donation-alerts/api-call';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
	type AccessToken,
	compareScopes,
	getAccessToken,
	MissingScopeError,
	refreshAccessToken,
} from '../src/index.js';

vi.mock('@donation-alerts/api-call', () => ({
	callDonationAlertsApi: vi.fn(),
}));

beforeEach(() => {
	vi.clearAllMocks();
});

describe('getAccessToken', () => {
	it('should return AccessToken with correct values', async () => {
		const apiResponse = {
			access_token: 'dummy-access',
			refresh_token: 'dummy-refresh',
			expires_in: 3600,
		};

		vi.mocked(callDonationAlertsApi).mockResolvedValue(apiResponse as any);

		const clientId = 'client-id';
		const clientSecret = 'client-secret';
		const redirectUri = 'http://localhost';
		const code = 'auth-code';

		const token: AccessToken = await getAccessToken(clientId, clientSecret, redirectUri, code);

		expect(token.accessToken).toBe(apiResponse.access_token);
		expect(token.refreshToken).toBe(apiResponse.refresh_token);
		expect(token.expiresIn).toBe(apiResponse.expires_in);
		expect(token.obtainmentTimestamp).toBeTypeOf('number');
	});
});

describe('refreshAccessToken', () => {
	it('should return AccessToken with correct values on refresh', async () => {
		const apiResponse = {
			access_token: 'refreshed-access',
			refresh_token: 'refreshed-refresh',
			expires_in: 7200,
		};

		vi.mocked(callDonationAlertsApi).mockResolvedValue(apiResponse as any);

		const clientId = 'client-id';
		const clientSecret = 'client-secret';
		const refreshTokenValue = 'old-refresh-token';
		const scopes = ['scope1', 'scope2'];

		const token: AccessToken = await refreshAccessToken(clientId, clientSecret, refreshTokenValue, scopes);

		expect(token.accessToken).toBe(apiResponse.access_token);
		expect(token.refreshToken).toBe(apiResponse.refresh_token);
		expect(token.expiresIn).toBe(apiResponse.expires_in);
		expect(token.obtainmentTimestamp).toBeTypeOf('number');
	});
});

describe('compareScopes', () => {
	it('should not throw when all requested scopes are present', () => {
		const tokenScopes = ['scope1', 'scope2', 'scope3'];
		const requestedScopes = ['scope1', 'scope3'];

		expect(() => compareScopes(tokenScopes, requestedScopes, 123)).not.toThrow();
	});

	it('should throw MissingScopeError when requested scope is missing', () => {
		const userId = 123;
		const tokenScopes = ['scope1', 'scope2'];
		const requestedScopes = ['scope1', 'scope3'];

		try {
			compareScopes(tokenScopes, requestedScopes, userId);
			throw new Error('Expected error');
		} catch (e) {
			expect(e).toBeInstanceOf(MissingScopeError);
			expect((e as MissingScopeError).userId).toBe(userId);
			expect((e as MissingScopeError).scopes).toEqual(['scope3']);
		}
	});

	it('should throw MissingScopeError with null userId when userId is not provided', () => {
		const tokenScopes = ['scope1', 'scope2'];
		const requestedScopes = ['scope1', 'scope3'];

		try {
			compareScopes(tokenScopes, requestedScopes);
			throw new Error('Expected error');
		} catch (e) {
			expect(e).toBeInstanceOf(MissingScopeError);
			expect((e as MissingScopeError).userId).toBe(null);
			expect((e as MissingScopeError).scopes).toEqual(['scope3']);
		}
	});

	it('should not throw when requestedScopes is undefined', () => {
		const tokenScopes = ['scope1', 'scope2'];

		expect(() => compareScopes(tokenScopes, undefined, 123)).not.toThrow();
	});
});
