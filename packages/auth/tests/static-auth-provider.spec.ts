import { beforeEach, describe, expect, it } from 'vitest';
import { InvalidTokenError, MissingScopeError, StaticAuthProvider, UnregisteredUserError } from '../src/index.js';

const CLIENT_ID = 'TEST_CLIENT_ID';
const SCOPES = ['oauth-user-show', 'oauth-donation-index'];
const MISSING_SCOPE = 'oauth-custom_alert-store';
const USER_ID = 12_345_678;
const ACCESS_TOKEN = 'TEST_ACCESS_TOKEN';

describe('StaticAuthProvider', () => {
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
