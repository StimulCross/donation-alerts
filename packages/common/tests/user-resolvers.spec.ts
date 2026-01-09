import { describe, it, expect } from 'vitest';
import {
	extractUserId,
	extractUserName,
	type UserIdResolvableType,
	type UserNameResolvableType,
} from '../src/index.js';

describe('extractUserId', () => {
	it('should return the number when a number is provided', () => {
		const result = extractUserId(123);

		expect(result).toBe(123);
	});

	it('should return the number when a numeric string is provided', () => {
		const result = extractUserId('456');

		expect(result).toBe(456);
	});

	it('should return the number when an object with a numeric id is provided', () => {
		const user: UserIdResolvableType = { id: 789 };

		const result = extractUserId(user);

		expect(result).toBe(789);
	});

	it('should return the number when an object with a numeric string id is provided', () => {
		const user: UserIdResolvableType = { id: '101112' };

		const result = extractUserId(user);

		expect(result).toBe(101_112);
	});

	it('should throw when a non-numeric string is provided', () => {
		expect(() => extractUserId('abc')).toThrowError(new TypeError('User ID must be integer or numeric string'));
	});

	it('should throw when an object contains a non-numeric id', () => {
		const user: UserIdResolvableType = { id: 'abc' };

		expect(() => extractUserId(user)).toThrowError(new TypeError('User ID must be integer or numeric string'));
	});
});

describe('extractUserName', () => {
	it('should return the name when a string is provided', () => {
		const result = extractUserName('stimulcross');

		expect(result).toBe('stimulcross');
	});

	it('should return the name when an object with a name is provided', () => {
		const user: UserNameResolvableType = { name: 'vitest' };

		const result = extractUserName(user);

		expect(result).toBe('vitest');
	});
});
