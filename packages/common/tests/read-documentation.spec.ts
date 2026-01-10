import util from 'node:util';
import { describe, it, expect } from 'vitest';
import { DataObject, ReadDocumentation } from '../src/index.js';

describe('ReadDocumentation', () => {
	it('should define custom inspect symbol on class prototype', () => {
		@ReadDocumentation('common')
		class TestClass {}

		const descriptor = Object.getOwnPropertyDescriptor(
			TestClass.prototype,
			Symbol.for('nodejs.util.inspect.custom'),
		);

		expect(descriptor).toBeDefined();
		expect(descriptor?.enumerable).toBe(false);
		expect(typeof descriptor?.value).toBe('function');
	});

	it('should render documentation link for non DataObject instance', () => {
		@ReadDocumentation('common')
		class TestClass {}

		const instance = new TestClass();
		const inspectFn = (instance as any)[Symbol.for('nodejs.util.inspect.custom')];

		const result = inspectFn(null, {}, util.inspect);

		expect(result).toContain('[TestClass]');
		expect(result).toContain('see docs to explore all members');
		expect(result).toContain('https://stimulcross.github.io/donation-alerts/classes/common.TestClass.html');
	});

	it('should include serialized data for DataObject instance', () => {
		class TestDataObject extends DataObject<{ id: number }> {
			override toJSON() {
				return { id: 123 };
			}
		}

		@ReadDocumentation('common')
		class DocumentedDataObject extends TestDataObject {}

		const instance = new DocumentedDataObject({ id: 123 });
		const result = (instance as any)[Symbol.for('nodejs.util.inspect.custom')](null, {}, util.inspect);

		expect(result).toContain('[DocumentedDataObject]');
		expect(result).toContain('{ id: 123 }');
		expect(result).toContain(
			'https://stimulcross.github.io/donation-alerts/classes/common.DocumentedDataObject.html',
		);
	});

	it('should throw TypeError when applied to non class target', () => {
		expect(() => {
			// @ts-expect-error
			ReadDocumentation('common')(() => {}, { kind: 'method' } as any);
		}).toThrow(TypeError);
	});
});
