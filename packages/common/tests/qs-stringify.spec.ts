import { describe, it, expect } from 'vitest';
import { qsStringify } from '../src/index.js';

describe('qsStringify', () => {
	it('should return empty string when object is undefined', () => {
		const result = qsStringify(undefined);

		expect(result).toBe('');
	});

	it('should return empty string when object is empty', () => {
		const result = qsStringify({});

		expect(result).toBe('');
	});

	it('should stringify flat object without query prefix', () => {
		const result = qsStringify({ a: 1, b: 'test' });

		expect(result).toBe('a=1&b=test');
	});

	it('should add query prefix when enabled', () => {
		const result = qsStringify({ a: 1, b: 2 }, true);

		expect(result).toBe('?a=1&b=2');
	});

	it('should serialize array values as repeated keys', () => {
		const result = qsStringify({ a: [1, 2, 3] });

		expect(result).toBe('a=1&a=2&a=3');
	});

	it('should serialize nested objects using bracket notation', () => {
		const params = {
			title: {
				en_US: 'Credit case',
				ru_RU: 'Кредитный кейс',
			},
			is_active: '1',
		};

		const result = qsStringify(params);

		expect(result).toBe(
			'title%5Ben_US%5D=Credit%20case&title%5Bru_RU%5D=%D0%9A%D1%80%D0%B5%D0%B4%D0%B8%D1%82%D0%BD%D1%8B%D0%B9%20%D0%BA%D0%B5%D0%B9%D1%81&is_active=1',
		);
	});

	it('should preserve nested object structure with query prefix enabled', () => {
		const params = {
			title: {
				en_US: 'Credit case',
			},
		};

		const result = qsStringify(params, true);

		expect(result).toBe('?title%5Ben_US%5D=Credit%20case');
	});
});
