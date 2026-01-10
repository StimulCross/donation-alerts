import { describe, it, expect } from 'vitest';
import { createSha256SignatureFromParams } from '../src/utils/create-sha256-signature-from-params.js';

describe('createSha256SignatureFromParams', () => {
	const secret = 'test_secret';

	it('should generate same signature for same params regardless of key order', () => {
		const a = {
			foo: 'xyz',
			bar: 'abc',
		};

		const b = {
			bar: 'abc',
			foo: 'xyz',
		};

		const sigA = createSha256SignatureFromParams(a, secret);
		const sigB = createSha256SignatureFromParams(b, secret);

		expect(sigA).toBe(sigB);
	});

	it('should generate same signature for nested objects', () => {
		const params = {
			title: {
				en_US: 'Credit case',
				ru_RU: 'Кредитный кейс',
			},
			is_active: '1',
		};

		const params2 = {
			is_active: '1',
			title: {
				ru_RU: 'Кредитный кейс',
				en_US: 'Credit case',
			},
		};

		const signature = createSha256SignatureFromParams(params, secret);
		const signature2 = createSha256SignatureFromParams(params2, secret);

		expect(signature).toBe(signature2);
	});

	it('should include array values in signature', () => {
		const params = {
			values: [3, 1, 2],
		};

		const sig1 = createSha256SignatureFromParams(params, secret);
		const sig2 = createSha256SignatureFromParams({ values: [1, 2, 3] }, secret);

		expect(sig1).toBe(sig2);
	});

	it('should ignore undefined values', () => {
		const a = {
			a: 1,
			b: undefined,
		};

		const b = {
			a: 1,
		};

		const sigA = createSha256SignatureFromParams(a, secret);
		const sigB = createSha256SignatureFromParams(b, secret);

		expect(sigA).toBe(sigB);
	});

	it('should include null values in signature', () => {
		const params = {
			a: null,
			b: 1,
		};

		const signature = createSha256SignatureFromParams(params, secret);

		expect(signature).toBeTypeOf('string');
		expect(signature).toHaveLength(64);
	});

	it('should produce different signatures for different secrets', () => {
		const params = {
			a: 1,
			b: 2,
		};

		const sig1 = createSha256SignatureFromParams(params, 'secret1');
		const sig2 = createSha256SignatureFromParams(params, 'secret2');

		expect(sig1).not.toBe(sig2);
	});

	it('should work with primitive values only', () => {
		const params = {
			a: 42,
			b: false,
			c: 'test',
		};

		const signature = createSha256SignatureFromParams(params, secret);

		expect(signature).toBeTypeOf('string');
		expect(signature).toHaveLength(64);
	});

	it('should generate deterministic signature across multiple calls', () => {
		const params = {
			title: {
				en_US: 'Credit case',
				ru_RU: 'Кредитный кейс',
			},
			price_user: 30,
			price_service: 15,
		};

		const sig1 = createSha256SignatureFromParams(params, secret);
		const sig2 = createSha256SignatureFromParams(params, secret);

		expect(sig1).toBe(sig2);
	});
});
