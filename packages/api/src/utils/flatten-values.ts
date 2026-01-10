/** @internal */
export function flattenValues(input: unknown, out: unknown[] = []): unknown[] {
	if (input === undefined) {
		return out;
	}

	if (typeof input !== 'object' || input === null) {
		out.push(input);
		return out;
	}

	if (Array.isArray(input)) {
		for (const item of input) {
			flattenValues(item, out);
		}

		return out;
	}

	const obj = input as Record<PropertyKey, unknown>;

	for (const value of Object.values(obj)) {
		flattenValues(value, out);
	}

	return out;
}
