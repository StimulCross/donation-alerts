export function Memoize() {
	return function <T>(value: () => T, context: ClassGetterDecoratorContext) {
		if (context.kind !== 'getter') {
			throw new TypeError('Memoize can only be used on getters');
		}

		const cache = new WeakMap<object, T>();

		return function (this: object): T {
			if (cache.has(this)) {
				return cache.get(this)!;
			}

			const result = value.call(this);
			cache.set(this, result);
			return result;
		};
	};
}
