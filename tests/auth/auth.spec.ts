import { InvalidTokenError, MissingScopeError, StaticAuthProvider, UnregisteredUserError } from '@donation-alerts/auth';

const CLIENT_ID = 'TEST_CLIENT_ID';
const SCOPES = ['oauth-user-show', 'oauth-donation-index'];
const MISSING_SCOPE = 'oauth-custom_alert-store';
const USER_ID = 12345678;
const ACCESS_TOKEN = 'TEST_ACCESS_TOKEN';

describe('Donation Alerts Auth Test Suits', () => {
	describe('Static auth provider', () => {
		const provider = new StaticAuthProvider(CLIENT_ID, SCOPES);

		beforeEach(() => {
			provider.removeUser(USER_ID);
			provider.addUser(USER_ID, { accessToken: ACCESS_TOKEN, scopes: SCOPES });
		});

		it('should return correct client ID', () => {
			expect(provider.clientId).toBe(CLIENT_ID);
		});

		it('should add user', () => {
			provider.addUser(USER_ID, { accessToken: ACCESS_TOKEN, scopes: SCOPES });
			expect(provider.hasUser(USER_ID)).toBe(true);
		});

		it('should throw "InvalidTokenError" if token is empty string', () => {
			const t = (): void => {
				provider.addUser(USER_ID, { accessToken: '' });
			};

			expect(t).toThrow(InvalidTokenError);
		});

		it('should throw "MissingScopeError" if token does not include required scopes', () => {
			const t = (): void => {
				provider.addUser(USER_ID, { accessToken: ACCESS_TOKEN, scopes: ['oauth-user-show'] });
			};

			expect(t).toThrow(MissingScopeError);
		});

		it('should get access token for user', async () => {
			const token = await provider.getAccessTokenForUser(USER_ID);
			expect(token.accessToken).toBe(ACCESS_TOKEN);
		});

		it('should throw "UnregisteredUserError" if user was not added', async () => {
			await expect(provider.getAccessTokenForUser(123456)).rejects.toThrow(UnregisteredUserError);
		});

		it('should throw "MissingScopeError" if token does not include requested scope', async () => {
			provider.addUser(USER_ID, { accessToken: ACCESS_TOKEN, scopes: SCOPES });
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
});
