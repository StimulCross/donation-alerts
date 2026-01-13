import { describe, it, expect } from 'vitest';
import { DataObject, getRawData, rawDataSymbol, ReadDocumentation } from '../src/index.js';

class TestDataObject<T> extends DataObject<T> {
	public override toJSON(): object {
		return {};
	}
}

@ReadDocumentation('common')
class SerializableDataObject<T extends { id: number }> extends DataObject<T> {
	public get id(): number {
		return this[rawDataSymbol].id;
	}

	public override toJSON(): object {
		return { id: this.id };
	}
}

describe('getRawData', () => {
	it('should return a deep cloned raw data from DataObject', () => {
		const originalData = { a: 1, b: { c: 2 } };
		const instance = new TestDataObject(originalData);

		const clonedData = getRawData(instance);

		expect(clonedData).toEqual(originalData);

		clonedData.b.c = 100;
		expect(originalData.b.c).toBe(2);
	});

	it('should return a cloned copy with a different reference', () => {
		const originalData = { x: 10, y: 20 };
		const instance = new TestDataObject(originalData);

		const clonedData = getRawData(instance);

		expect(clonedData).not.toBe(originalData);
	});
});

describe('DataObject', () => {
	it('should define rawDataSymbol as non-enumerable', () => {
		const data = { key: 'value' };
		const instance = new TestDataObject(data);

		const descriptor = Object.getOwnPropertyDescriptor(instance, rawDataSymbol);

		expect(descriptor).toBeDefined();
		expect(descriptor?.enumerable).toBe(false);
	});

	it('should not expose rawDataSymbol via Object.keys', () => {
		const data = { key: 'value' };
		const instance = new TestDataObject(data);

		const keys = Object.keys(instance);

		expect(keys).not.toContain(String(rawDataSymbol));
	});

	it('should serialize using toJSON during JSON.stringify', () => {
		const data = { id: 123 };
		const instance = new SerializableDataObject(data);

		expect(instance.toJSON()).toEqual(data);
		expect(JSON.stringify(instance)).toBe(JSON.stringify(data));
	});
});
