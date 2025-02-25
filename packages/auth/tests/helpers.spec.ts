import { callDonationAlertsApi } from '@donation-alerts/api-call';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AccessToken, compareScopes, getAccessToken, MissingScopeError, refreshAccessToken } from '../src';

vi.mock('@donation-alerts/api-call');

beforeEach(() => {
	vi.clearAllMocks();
});

describe('getAccessToken', () => {
	it('should return an AccessToken object with correct values', async () => {
		const apiResponse = {
			access_token: 'dummy-access',
			refresh_token: 'dummy-refresh',
			expires_in: 3600,
		};

		(callDonationAlertsApi as any).mockResolvedValue(apiResponse);

		const clientId = 'client-id';
		const clientSecret = 'client-secret';
		const redirectUri = 'http://localhost';
		const code = 'auth-code';

		const token: AccessToken = await getAccessToken(clientId, clientSecret, redirectUri, code);

		expect(token).toEqual({
			accessToken: apiResponse.access_token,
			refreshToken: apiResponse.refresh_token,
			expiresIn: apiResponse.expires_in,
			obtainmentTimestamp: expect.any(Number),
		});
	});
});

describe('refreshAccessToken', () => {
	it('should return an AccessToken object with correct values on token refresh', async () => {
		const apiResponse = {
			access_token: 'refreshed-access',
			refresh_token: 'refreshed-refresh',
			expires_in: 7200,
		};

		(callDonationAlertsApi as any).mockResolvedValue(apiResponse);

		const clientId = 'client-id';
		const clientSecret = 'client-secret';
		const refreshToken = 'old-refresh-token';
		const scopes: string[] = ['scope1', 'scope2'];

		const token: AccessToken = await refreshAccessToken(clientId, clientSecret, refreshToken, scopes);

		expect(token).toEqual({
			accessToken: apiResponse.access_token,
			refreshToken: apiResponse.refresh_token,
			expiresIn: apiResponse.expires_in,
			obtainmentTimestamp: expect.any(Number),
		});
	});
});

describe('compareScopes', () => {
	it('should not throw an error if all requested scopes are contained in the token scopes', () => {
		const tokenScopes = ['scope1', 'scope2', 'scope3'];
		const requestedScopes = ['scope1', 'scope3'];

		// The function should not throw when requestedScopes are included
		expect(() => {
			compareScopes(tokenScopes, requestedScopes);
		}).not.toThrow();
	});

	it('should throw MissingScopeError if any requested scope is missing', () => {
		const tokenScopes = ['scope1', 'scope2'];
		const requestedScopes = ['scope1', 'scope3'];

		// The function should throw MissingScopeError when a required scope is missing
		expect(() => {
			compareScopes(tokenScopes, requestedScopes);
		}).toThrow(MissingScopeError);
	});

	it('should not throw an error if requestedScopes is undefined', () => {
		// When no scopes are requested, the function does nothing
		const tokenScopes = ['scope1', 'scope2'];
		const requestedScopes = undefined;

		expect(() => {
			compareScopes(tokenScopes, requestedScopes);
		}).not.toThrow();
	});
});
