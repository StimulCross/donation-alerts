import { describe, it, expect } from 'vitest';
import { Memoize } from '../src/index.js';

describe('Memoize', () => {
	it('should cache getter result per instance', () => {
		let calls = 0;

		class TestClass {
			@Memoize()
			public get value(): number {
				calls++;
				return 42;
			}
		}

		const instance = new TestClass();

		expect(instance.value).toBe(42);
		expect(instance.value).toBe(42);
		expect(calls).toBe(1);
	});

	it('should cache values independently per instance', () => {
		let calls = 0;

		class TestClass {
			@Memoize()
			public get value(): number {
				calls++;
				return Math.random();
			}
		}

		const a = new TestClass();
		const b = new TestClass();

		const valueA1 = a.value;
		const valueA2 = a.value;
		const valueB1 = b.value;
		const valueB2 = b.value;

		expect(valueA1).toBe(valueA2);
		expect(valueB1).toBe(valueB2);
		expect(valueA1).not.toBe(valueB1);
		expect(calls).toBe(2);
	});

	it('should preserve this binding inside getter', () => {
		class TestClass {
			constructor(private readonly base: number) {}

			@Memoize()
			public get value(): number {
				return this.base * 2;
			}
		}

		const instance = new TestClass(10);

		expect(instance.value).toBe(20);
	});

	it('should not recompute value after first access even if internal state changes', () => {
		class TestClass {
			private counter = 1;

			@Memoize()
			public get value(): number {
				return this.counter;
			}

			public increment(): void {
				this.counter++;
			}
		}

		const instance = new TestClass();

		const first = instance.value;
		instance.increment();
		const second = instance.value;

		expect(first).toBe(1);
		expect(second).toBe(1);
	});

	it('should throw TypeError when applied to non-getter', () => {
		expect(() => {
			class TestClass {
				// @ts-expect-error should throw error because the method is not a getter
				@Memoize()
				public method(): number {
					return 1;
				}
			}

			return TestClass;
		}).toThrow(TypeError);
	});
});
