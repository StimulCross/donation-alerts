import { describe, it, expect } from 'vitest';
import { flattenValues } from '../src/utils/flatten-values.js';

describe('flattenValues', () => {
	it('should flatten values of a flat object', () => {
		const input = {
			a: 1,
			b: 'test',
			c: true,
		};

		expect(flattenValues(input)).toEqual(expect.arrayContaining([1, 'test', true]));
	});

	it('should flatten nested objects', () => {
		const input = { a: { b: { c: 1 } } };
		expect(flattenValues(input)).toEqual([1]);
	});

	it('should flatten arrays', () => {
		const input = { a: [1, 2, 3] };
		expect(flattenValues(input)).toEqual([1, 2, 3]);
	});

	it('should flatten mixed objects and arrays', () => {
		const input = {
			a: [1, { b: 2 }],
			c: 'test',
		};

		expect(flattenValues(input)).toEqual(expect.arrayContaining([1, 2, 'test']));
	});

	it('should keep null values', () => {
		const input = {
			a: null,
			b: 1,
		};

		expect(flattenValues(input)).toEqual(expect.arrayContaining([null, 1]));
	});

	it('should ignore undefined values', () => {
		const input = {
			a: undefined,
			b: 1,
		};

		expect(flattenValues(input)).toEqual([1]);
	});

	it('should work with primitive input', () => {
		expect(flattenValues(42)).toEqual([42]);
		expect(flattenValues('test')).toEqual(['test']);
		expect(flattenValues(false)).toEqual([false]);
	});

	it('should return empty array for undefined input', () => {
		expect(flattenValues(undefined)).toEqual([]);
	});

	it('should append values to provided output array', () => {
		const out: unknown[] = ['existing'];

		flattenValues(1, out);

		expect(out).toEqual(['existing', 1]);
	});
});
