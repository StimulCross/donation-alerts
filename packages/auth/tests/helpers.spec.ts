import { callDonationAlertsApi } from '@donation-alerts/api-call';
import { AccessToken, compareScopes, getAccessToken, MissingScopeError, refreshAccessToken } from '../src';

jest.mock('@donation-alerts/api-call');

beforeEach(() => {
	jest.clearAllMocks();
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
			compareScopes(tokenScopes, requestedScopes, 123);
		}).not.toThrow(MissingScopeError);
	});

	it('should throw MissingScopeError if any requested scope is missing', () => {
		const userId = 123;
		const tokenScopes = ['scope1', 'scope2'];
		const requestedScopes = ['scope1', 'scope3'];

		try {
			compareScopes(tokenScopes, requestedScopes, userId);
			fail('Expected MissingScopeError to be thrown');
		} catch (e) {
			expect(e).toBeInstanceOf(MissingScopeError);
			expect((e as MissingScopeError).userId).toBe(userId);
			expect((e as MissingScopeError).scopes).toEqual(['scope3']);
		}
	});

	it('should not throw an error if requestedScopes is undefined', () => {
		// When no scopes are requested, the function does nothing
		const tokenScopes = ['scope1', 'scope2'];
		const requestedScopes = undefined;

		expect(() => {
			compareScopes(tokenScopes, requestedScopes, 123);
		}).not.toThrow(MissingScopeError);
	});
});
