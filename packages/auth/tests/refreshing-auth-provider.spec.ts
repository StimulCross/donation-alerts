import * as apiCall from '@donation-alerts/api-call';
import { promiseWithResolvers } from '@donation-alerts/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type AccessToken, RefreshingAuthProvider, UnregisteredUserError } from '../src/index.js';
import { MemoryAuthStorageAdapter } from '../src/storages/memory-auth-storage.adapter.js';
import * as utils from '../src/utils/access-token-utils.js';

const CLIENT_ID = 'TEST_CLIENT_ID';
const CLIENT_SECRET = 'TEST_CLIENT_SECRET';
const SCOPES = ['oauth-user-show', 'oauth-donation-index'];
const USER_ID = 12_345_678;

function createToken(overrides?: Partial<AccessToken>): AccessToken {
	return {
		accessToken: 'TEST_ACCESS',
		refreshToken: 'TEST_REFRESH',
		expiresIn: 3600,
		obtainmentTimestamp: Date.now(),
		scopes: SCOPES,
		...overrides,
	};
}

describe('RefreshingAuthProvider', () => {
	let provider: RefreshingAuthProvider;
	let storage: MemoryAuthStorageAdapter;

	beforeEach(() => {
		vi.useFakeTimers();
		storage = new MemoryAuthStorageAdapter();

		provider = new RefreshingAuthProvider({
			clientId: CLIENT_ID,
			clientSecret: CLIENT_SECRET,
			scopes: SCOPES,
			redirectUri: 'http://localhost',
			storage,
		});

		vi.spyOn(apiCall, 'callDonationAlertsApi').mockResolvedValue({
			data: { id: USER_ID },
		});
	});

	afterEach(async () => {
		await storage.destroy();
		vi.restoreAllMocks();
		vi.useRealTimers();
	});

	describe('Basic Properties and User Management', () => {
		it('should return correct client credentials', () => {
			expect(provider.clientId).toBe(CLIENT_ID);
			expect(provider.clientSecret).toBe(CLIENT_SECRET);
		});

		it('should add user and verify existence', async () => {
			await provider.addUser(USER_ID, createToken());
			expect(await provider.hasUser(USER_ID)).toBe(true);
		});

		it('should remove user', async () => {
			await provider.addUser(USER_ID, createToken());
			await provider.removeUser(USER_ID);
			expect(await provider.hasUser(USER_ID)).toBe(false);
		});
	});

	describe('Access Token Retrieval', () => {
		it('should throw UnregisteredUserError when requesting token for unknown user', async () => {
			await expect(provider.getAccessTokenForUser(123)).rejects.toThrow(UnregisteredUserError);
		});

		it('should return cached token if it is not expired', async () => {
			const token = createToken();
			await provider.addUser(USER_ID, token);

			const refreshSpy = vi.spyOn(utils, 'refreshAccessToken');
			const result = await provider.getAccessTokenForUser(USER_ID);

			expect(result.accessToken).toBe(token.accessToken);
			expect(refreshSpy).not.toHaveBeenCalled();
		});

		it('should trigger refresh if token is expired', async () => {
			const expiredToken = createToken({ obtainmentTimestamp: Date.now() - 10_000, expiresIn: 5 });
			await provider.addUser(USER_ID, expiredToken);

			const refreshedToken = createToken({ accessToken: 'NEW_ACCESS', refreshToken: 'NEW_REFRESH' });
			const refreshSpy = vi.spyOn(utils, 'refreshAccessToken').mockResolvedValue(refreshedToken);

			const result = await provider.getAccessTokenForUser(USER_ID);

			expect(refreshSpy).toHaveBeenCalledTimes(1);
			expect(result).toEqual({ ...refreshedToken, userId: USER_ID });
		});
	});

	describe('Concurrency and Race Conditions', () => {
		it('should deduplicate refresh requests and protect against Thundering Herd', async () => {
			const expiredToken = createToken({ obtainmentTimestamp: Date.now() - 10_000, expiresIn: 5 });
			await provider.addUser(USER_ID, expiredToken);

			const { promise: refreshDelay, resolve: resolveRefresh } = promiseWithResolvers<AccessToken>();
			const refreshSpy = vi.spyOn(utils, 'refreshAccessToken').mockReturnValue(refreshDelay);

			const onRefreshSpy = vi.fn();
			provider.onRefresh(onRefreshSpy);

			const p1 = provider.getAccessTokenForUser(USER_ID);
			const p2 = provider.getAccessTokenForUser(USER_ID);
			const p3 = provider.getAccessTokenForUser(USER_ID);

			await vi.advanceTimersByTimeAsync(0);

			expect(refreshSpy).toHaveBeenCalledTimes(1);

			resolveRefresh(createToken({ accessToken: 'DEDUPLICATED_ACCESS' }));

			const [res1, res2, res3] = await Promise.all([p1, p2, p3]);

			expect(res1.accessToken).toBe('DEDUPLICATED_ACCESS');
			expect(res2.accessToken).toBe('DEDUPLICATED_ACCESS');
			expect(res3.accessToken).toBe('DEDUPLICATED_ACCESS');

			expect(refreshSpy).toHaveBeenCalledTimes(1);
			expect(onRefreshSpy).toHaveBeenCalledTimes(1);
		});
	});

	describe('Forced Refresh', () => {
		it('should force refresh even if token is valid', async () => {
			await provider.addUser(USER_ID, createToken());

			const refreshSpy = vi
				.spyOn(utils, 'refreshAccessToken')
				.mockResolvedValue(createToken({ accessToken: 'FORCED_ACCESS' }));

			const result = await provider.refreshAccessTokenForUser(USER_ID);

			expect(refreshSpy).toHaveBeenCalledTimes(1);
			expect(result.accessToken).toBe('FORCED_ACCESS');
		});
	});
});
