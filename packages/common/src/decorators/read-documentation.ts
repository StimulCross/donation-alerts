import { DataObject } from '../utils/data-object.js';

const ANSI_CYAN = '\u001B[36m';
const ANSI_GRAY = '\u001B[90m';
const ANSI_RESET = '\u001B[0m';

const BASE_URL = 'https://stimulcross.github.io/donation-alerts';

const PACKAGE_MAP: Record<DocumentationPackage, string> = {
	api: 'api',
	'api-call': 'api_call',
	auth: 'auth',
	common: 'common',
	events: 'events',
};

/** @internal */
export type DocumentationPackage = 'api' | 'api-call' | 'auth' | 'common' | 'events';

export function ReadDocumentation(pkg: DocumentationPackage) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return function (cls: abstract new (...args: any[]) => any, context: ClassDecoratorContext): void {
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		if (context.kind !== 'class') {
			throw new TypeError('ReadDocumentation can only be used on classes');
		}

		context.addInitializer(() => {
			Reflect.defineProperty(cls.prototype, Symbol.for('nodejs.util.inspect.custom'), {
				value: function (this: unknown, _: number | null, options: object, inspect: Function): string {
					if (this instanceof DataObject) {
						return (
							`${ANSI_CYAN}[${cls.name}]${ANSI_RESET} ` +
							// eslint-disable-next-line @typescript-eslint/no-unsafe-call
							`${inspect(this.toJSON(), options)} ` +
							`${ANSI_GRAY}- see docs to explore all members: ` +
							`${BASE_URL}/classes/${PACKAGE_MAP[pkg]}.${cls.name}.html` +
							`${ANSI_RESET}`
						);
					}

					return (
						`${ANSI_CYAN}[${cls.name}]${ANSI_RESET} ` +
						'- see docs to explore all members: ' +
						`${BASE_URL}/classes/${PACKAGE_MAP[pkg]}.${cls.name}.html`
					);
				},
				enumerable: false,
			});
		});
	};
}
