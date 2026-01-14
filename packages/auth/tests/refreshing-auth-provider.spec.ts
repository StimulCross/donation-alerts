import * as apiCall from '@donation-alerts/api-call';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	type AccessToken,
	type AccessTokenWithUserId,
	RefreshingAuthProvider,
	UnregisteredUserError,
} from '../src/index.js';
import * as utils from '../src/utils/access-token-utils.js';

const CLIENT_ID = 'TEST_CLIENT_ID';
const CLIENT_SECRET = 'TEST_CLIENT_SECRET';
const SCOPES = ['oauth-user-show', 'oauth-donation-index'];
const USER_ID = 12_345_678;
const ACCESS_TOKEN = 'TEST_ACCESS_TOKEN';
const REFRESH_TOKEN = 'TEST_REFRESH_TOKEN';

describe('RefreshingAuthProvider', () => {
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

		const refreshSpy = vi.spyOn(utils, 'refreshAccessToken').mockResolvedValue(updatedToken);

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
