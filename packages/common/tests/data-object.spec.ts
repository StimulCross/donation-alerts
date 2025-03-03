import { DataObject, getRawData, rawDataSymbol, ReadDocumentation } from '../src';

class TestDataObject<T> extends DataObject<T> {
	override toJSON(): object {
		return {};
	}
}

@ReadDocumentation('common')
class SerializableDataObject<T extends { id: number }> extends DataObject<T> {
	constructor(data: T) {
		super(data);
	}

	get id(): number {
		return this[rawDataSymbol].id;
	}

	override toJSON(): object {
		return {
			id: this.id,
		};
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

	it('should return a cloned copy that is not the same reference as the original', () => {
		const originalData = { x: 10, y: 20 };
		const instance = new TestDataObject(originalData);
		const clonedData = getRawData(instance);

		expect(clonedData).not.toBe(originalData);
	});
});

describe('DataObject', () => {
	it('should have non-enumerable rawDataSymbol property in DataObject instance', () => {
		const data = { key: 'value' };
		const instance = new TestDataObject(data);

		const descriptor = Object.getOwnPropertyDescriptor(instance, rawDataSymbol);
		expect(descriptor).toBeDefined();
		expect(descriptor?.enumerable).toBe(false);
	});

	it('should not list rawDataSymbol property in Object.keys result', () => {
		const data = { key: 'value' };
		const instance = new TestDataObject(data);

		const keys = Object.keys(instance);
		expect(keys).not.toContain(String(rawDataSymbol));
	});

	it('should convert the instance to a plain object using toJSON and JSON.stringify', () => {
		const data = { id: 123 };
		const instance = new SerializableDataObject(data);

		expect(instance.toJSON()).toEqual(data);
		expect(JSON.stringify(instance)).toEqual(JSON.stringify(data));
	});
});
