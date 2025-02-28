import * as apiCall from '@donation-alerts/api-call';
import {
	AccessToken,
	AccessTokenWithUserId,
	InvalidTokenError,
	MissingScopeError,
	RefreshingAuthProvider,
	StaticAuthProvider,
	UnregisteredUserError,
} from '../src';
import * as helpers from '../src/helpers';

// Constants for testing
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

		it('should throw "InvalidTokenError" if token is empty string', () => {
			try {
				provider.addUser(USER_ID, '');
				fail('Expected InvalidTokenError to be thrown');
			} catch (e) {
				expect(e).toBeInstanceOf(InvalidTokenError);
				expect(e as InvalidTokenError).toHaveProperty('userId', USER_ID);
			}
		});

		it('should throw "MissingScopeError" if token does not include required scopes', () => {
			const t = (): void => {
				provider.addUser(USER_ID, ACCESS_TOKEN, ['oauth-user-show']);
			};
			expect(t).toThrow(MissingScopeError);
		});

		it('should get access token for user', async () => {
			const token = await provider.getAccessTokenForUser(USER_ID);
			expect(token.accessToken).toBe(ACCESS_TOKEN);
		});

		it('should throw "UnregisteredUserError" if user was not added', async () => {
			const userId = 1234;

			try {
				await provider.getAccessTokenForUser(userId);
				fail('Expected UnregisteredUserError to be thrown');
			} catch (e) {
				expect(e).toBeInstanceOf(UnregisteredUserError);
				expect(e).toHaveProperty('userId', userId);
			}
		});

		it('should throw "MissingScopeError" if token does not include requested scope', async () => {
			provider.addUser(USER_ID, ACCESS_TOKEN, SCOPES);
			await expect(provider.getAccessTokenForUser(USER_ID, [MISSING_SCOPE])).rejects.toThrow(MissingScopeError);
		});

		it('should get current scopes', () => {
			expect(provider.getScopesForUser(USER_ID)).toStrictEqual(SCOPES);
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
		let provider = new RefreshingAuthProvider(config);

		beforeEach(() => {
			provider = new RefreshingAuthProvider(config);
			jest.restoreAllMocks();
			jest.spyOn(apiCall, 'callDonationAlertsApi').mockResolvedValue({ data: { id: 12_345 } });
		});

		it('should return correct client ID', () => {
			expect(provider.clientId).toBe(CLIENT_ID);
		});

		it('should add user using addUser', () => {
			const token: AccessToken = {
				accessToken: ACCESS_TOKEN,
				refreshToken: REFRESH_TOKEN,
				expiresIn: 3600,
				obtainmentTimestamp: Date.now(),
				scopes: SCOPES,
			};

			provider.addUser(USER_ID, token);
			expect(provider.hasUser(USER_ID)).toBe(true);
		});

		it('should refresh token and emit onRefresh event in addUserForToken', async () => {
			// Подготавливаем исходный токен
			const initialToken: AccessToken = {
				accessToken: ACCESS_TOKEN,
				refreshToken: REFRESH_TOKEN,
				expiresIn: 3600, // Токен считается просроченным для целей теста
				obtainmentTimestamp: Date.now(),
				scopes: SCOPES,
			};

			// Подготавливаем обновлённый токен, который должен вернуться после refresh
			const updatedToken: AccessToken = {
				accessToken: 'UPDATED_ACCESS_TOKEN',
				refreshToken: 'updated-refresh',
				expiresIn: 7200,
				obtainmentTimestamp: Date.now(),
				scopes: SCOPES,
			};

			// Подменяем refreshAccessToken из модуля helpers, чтобы избежать реального вызова API
			const refreshSpy = jest.spyOn(helpers, 'refreshAccessToken').mockResolvedValue(updatedToken);

			// Подписываемся на событие onRefresh, чтобы отследить его эмиссию
			const onRefreshSpy = jest.fn();
			provider.onRefresh(onRefreshSpy);

			// Вызываем метод addUserForToken, который должен использовать подменённый refreshAccessToken
			const tokenWithUser: AccessTokenWithUserId = await provider.addUserForToken(initialToken);

			// Verify that refreshAccessToken was called with correct parameters
			expect(refreshSpy).toHaveBeenCalledWith(CLIENT_ID, CLIENT_SECRET, initialToken.refreshToken, SCOPES);

			// Validate that the token returned reflects the updated token
			expect(tokenWithUser.accessToken).toBe(updatedToken.accessToken);

			// Validate that the onRefresh event was emitted once with the correct parameters
			expect(onRefreshSpy).toHaveBeenCalledTimes(1);
			const emittedArgs = onRefreshSpy.mock.calls[0];
			// Check first argument is a number (user id)
			expect(typeof emittedArgs[0]).toBe('number');
			expect(emittedArgs[1].accessToken).toBe(updatedToken.accessToken);

			// Clean up the spy
			refreshSpy.mockRestore();
		});

		it('should throw "UnregisteredUserError" when requesting token for a user that was not added', async () => {
			const userId = 123;

			try {
				await provider.getAccessTokenForUser(userId);
				fail('Expected UnregisteredUserError to be thrown');
			} catch (e) {
				expect(e).toBeInstanceOf(UnregisteredUserError);
				expect(e).toHaveProperty('userId', userId);
			}
		});
	});
});
