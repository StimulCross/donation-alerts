const NUMERIC_STRING_REGEX = /^\d+$/gu;

/**
 * A type that represents a user and contains a user ID.
 */
export interface UserIdResolvableType {
	/**
	 * The ID of the user.
	 */
	id: number | string;
}

/**
 * A type that represents a user and contains a username.
 */
export interface UserNameResolvableType {
	/**
	 * The name of the user.
	 */
	name: string;
}

/**
 * A user ID or an object containing `id` field with user ID.
 *
 * @example
 * let userId: UserIdResolvable
 *
 * userId = 123456789;
 * userId = '123456789';
 * userId = { id: 123456789 };
 * userId = { id: '123456789' };
 */
export type UserIdResolvable = string | number | UserIdResolvableType;

/**
 * A username or an object containing `name` field with username.
 *
 * @example
 * let username: UserNameResolvable
 *
 * username = 'stimulcross';
 * username = { name: 'stimulcross' };
 */
export type UserNameResolvable = string | UserNameResolvableType;

/**
 * Extracts the user ID from an argument that is possibly an object containing that ID.
 *
 * @param user The user ID or object.
 */
export function extractUserId(user: UserIdResolvable): number {
	if (typeof user === 'number') {
		return user;
	} else if (typeof user === 'string') {
		if (NUMERIC_STRING_REGEX.test(user)) {
			return parseInt(user, 10);
		}

		throw new TypeError('User ID must be integer or numeric string');
	} else {
		if (typeof user.id === 'number') {
			return user.id;
		}

		if (NUMERIC_STRING_REGEX.test(user.id)) {
			return parseInt(user.id, 10);
		}

		throw new TypeError('User ID must be integer or numeric string');
	}
}

/**
 * Extracts the username from an argument that is possibly an object containing that name.
 *
 * @param user The username or object containing `name` field with username.
 */
export function extractUserName(user: UserNameResolvable): string {
	return typeof user === 'string' ? user : user.name;
}
