import * as apiCall from '@donation-alerts/api-call';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as helpers from '../src/helpers.js';
import {
	AccessToken,
	AccessTokenWithUserId,
	InvalidTokenError,
	MissingScopeError,
	RefreshingAuthProvider,
	StaticAuthProvider,
	UnregisteredUserError,
} from '../src/index.js';

const CLIENT_ID = 'TEST_CLIENT_ID';
const CLIENT_SECRET = 'TEST_CLIENT_SECRET';
const SCOPES = ['oauth-user-show', 'oauth-donation-index'];
const MISSING_SCOPE = 'oauth-custom_alert-store';
const USER_ID = 12_345_678;
const ACCESS_TOKEN = 'TEST_ACCESS_TOKEN';
const REFRESH_TOKEN = 'TEST_REFRESH_TOKEN';

describe('auth', () => {
	describe('Static auth provider', () => {
		const provider = new StaticAuthProvider(CLIENT_ID, SCOPES);

		beforeEach(() => {
			provider.removeUser(USER_ID);
			provider.addUser(USER_ID, ACCESS_TOKEN, SCOPES);
		});

		it('should return correct client ID', () => {
			expect(provider.clientId).toBe(CLIENT_ID);
		});

		it('should add user', () => {
			provider.addUser(USER_ID, ACCESS_TOKEN, SCOPES);

			expect(provider.hasUser(USER_ID)).toBe(true);
		});

		it('should throw InvalidTokenError when token is empty string', () => {
			try {
				provider.addUser(USER_ID, '');
				throw new Error('Expected error');
			} catch (e) {
				expect(e).toBeInstanceOf(InvalidTokenError);
				expect((e as InvalidTokenError).userId).toBe(USER_ID);
			}
		});

		it('should throw MissingScopeError when token does not include required scopes', () => {
			expect(() => provider.addUser(USER_ID, ACCESS_TOKEN, ['oauth-user-show'])).toThrow(MissingScopeError);
		});

		it('should return access token for user', async () => {
			const token = await provider.getAccessTokenForUser(USER_ID);

			expect(token.accessToken).toBe(ACCESS_TOKEN);
		});

		it('should throw UnregisteredUserError when user was not added', async () => {
			const userId = 1234;

			try {
				await provider.getAccessTokenForUser(userId);
				throw new Error('Expected error');
			} catch (e) {
				expect(e).toBeInstanceOf(UnregisteredUserError);
				expect((e as UnregisteredUserError).userId).toBe(userId);
			}
		});

		it('should throw MissingScopeError when requested scope is missing', async () => {
			await expect(provider.getAccessTokenForUser(USER_ID, [MISSING_SCOPE])).rejects.toThrow(MissingScopeError);
		});

		it('should return current scopes for user', async () => {
			expect(await provider.getScopesForUser(USER_ID)).toStrictEqual(SCOPES);
		});

		it('should remove user', () => {
			provider.removeUser(USER_ID);

			expect(provider.hasUser(USER_ID)).toBe(false);
		});
	});

	describe('Refreshing auth provider', () => {
		const config = {
			clientId: CLIENT_ID,
			clientSecret: CLIENT_SECRET,
			scopes: SCOPES,
			redirectUri: 'http://localhost',
		};

		let provider: RefreshingAuthProvider;

		beforeEach(() => {
			provider = new RefreshingAuthProvider(config);

			vi.restoreAllMocks();

			vi.spyOn(apiCall, 'callDonationAlertsApi').mockResolvedValue({
				data: { id: USER_ID },
			});
		});

		it('should return correct client ID', () => {
			expect(provider.clientId).toBe(CLIENT_ID);
		});

		it('should add user using addUser', async () => {
			const token: AccessToken = {
				accessToken: ACCESS_TOKEN,
				refreshToken: REFRESH_TOKEN,
				expiresIn: 3600,
				obtainmentTimestamp: Date.now(),
				scopes: SCOPES,
			};

			await provider.addUser(USER_ID, token);

			expect(await provider.hasUser(USER_ID)).toBe(true);
		});

		it('should refresh token and emit onRefresh event in addUserForToken', async () => {
			const initialToken: AccessToken = {
				accessToken: ACCESS_TOKEN,
				refreshToken: REFRESH_TOKEN,
				expiresIn: 0,
				obtainmentTimestamp: Date.now(),
				scopes: SCOPES,
			};

			const updatedToken: AccessToken = {
				accessToken: 'UPDATED_ACCESS_TOKEN',
				refreshToken: 'UPDATED_REFRESH_TOKEN',
				expiresIn: 7200,
				obtainmentTimestamp: Date.now(),
				scopes: SCOPES,
			};

			const refreshSpy = vi.spyOn(helpers, 'refreshAccessToken').mockResolvedValue(updatedToken);

			const onRefreshSpy = vi.fn();
			provider.onRefresh(onRefreshSpy);

			const tokenWithUser: AccessTokenWithUserId = await provider.addUserForToken(initialToken);

			expect(refreshSpy).toHaveBeenCalledWith(CLIENT_ID, CLIENT_SECRET, initialToken.refreshToken, SCOPES);

			expect(tokenWithUser.accessToken).toBe(updatedToken.accessToken);

			expect(onRefreshSpy).toHaveBeenCalledTimes(1);
			expect(onRefreshSpy.mock.calls[0][0]).toBeTypeOf('number');
			expect(onRefreshSpy.mock.calls[0][1].accessToken).toBe(updatedToken.accessToken);
		});

		it('should throw UnregisteredUserError when requesting token for unknown user', async () => {
			const userId = 123;

			try {
				await provider.getAccessTokenForUser(userId);
				throw new Error('Expected error');
			} catch (e) {
				expect(e).toBeInstanceOf(UnregisteredUserError);
				expect((e as UnregisteredUserError).userId).toBe(userId);
			}
		});
	});
});
