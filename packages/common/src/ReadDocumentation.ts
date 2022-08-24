/* eslint-disable @typescript-eslint/naming-convention */

const BASE_URL = 'https://stimulcross.github.io/donation-alerts';

const PACKAGE_MAP: Record<DocumentationPackage, string> = {
	api: 'api',
	'api-call': 'api_call',
	auth: 'auth',
	common: 'common',
	events: 'events'
};

/** @internal */
export type DocumentationPackage = 'api' | 'api-call' | 'auth' | 'common' | 'events';

/** @internal */
export function ReadDocumentation(pkg: DocumentationPackage): ClassDecorator {
	return cls => {
		const fn = function (): string {
			return `[${cls.name}] - check docs to explore all properties: ${BASE_URL}/classes/${PACKAGE_MAP[pkg]}.${cls.name}.html`;
		};

		Object.defineProperty(cls.prototype, Symbol.for('nodejs.util.inspect.custom'), {
			value: fn,
			enumerable: false
		});
	};
}
