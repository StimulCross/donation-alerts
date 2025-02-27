import { DataObject, getRawData, rawDataSymbol } from '../src';

// Создадим минимальный класс-наследник для проверки абстрактного класса DataObject
class TestDataObject<T> extends DataObject<T> {}

describe('getRawData', () => {
	it('should return a deep cloned raw data from DataObject', () => {
		const originalData = { a: 1, b: { c: 2 } };
		const instance = new TestDataObject(originalData);
		const clonedData = getRawData(instance);

		// Проверяем, что клонированные данные равны исходным
		expect(clonedData).toEqual(originalData);

		// Изменяем клонированные данные и убеждаемся, что исходные не изменились (глубокое клонирование)
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

		// Получаем дескриптор свойства для rawDataSymbol
		const descriptor = Object.getOwnPropertyDescriptor(instance, rawDataSymbol);
		expect(descriptor).toBeDefined();
		expect(descriptor?.enumerable).toBe(false);
	});

	it('should not list rawDataSymbol property in Object.keys result', () => {
		const data = { key: 'value' };
		const instance = new TestDataObject(data);

		// Символьные свойства не попадают в Object.keys, поэтому ожидаем, что их там нет
		const keys = Object.keys(instance);
		expect(keys).not.toContain(String(rawDataSymbol));
	});
});
