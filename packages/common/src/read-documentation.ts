import type * as util from 'node:util';
import { DataObject } from './data-object';

const ANSI_CYAN = '\u001b[36m';
const ANSI_GRAY = '\u001b[90m';
const ANSI_RESET = '\u001b[0m';

const BASE_URL = 'https://stimulcross.github.io/donation-alerts';

const PACKAGE_MAP: Record<DocumentationPackage, string> = {
	api: 'api',
	'api-call': 'api_call',
	auth: 'auth',
	common: 'common',
	events: 'events',
};

/** @internal */
type Inspect = (depth: number | null, options: util.InspectOptionsStylized, inspect: typeof util.inspect) => string;

/** @internal */
export type DocumentationPackage = 'api' | 'api-call' | 'auth' | 'common' | 'events';

/** @internal */
export function ReadDocumentation(pkg: DocumentationPackage): ClassDecorator {
	return cls => {
		Object.defineProperty(cls.prototype, Symbol.for('nodejs.util.inspect.custom'), {
			value: function (
				this: {},
				_: number | null,
				options: util.InspectOptionsStylized,
				inspect: typeof util.inspect,
			): string {
				if (this instanceof DataObject) {
					return `${ANSI_CYAN}[${cls.name}]${ANSI_RESET} ${inspect(this.toJSON(), options)} ${ANSI_GRAY}- see docs to explore all members: ${BASE_URL}/classes/${PACKAGE_MAP[pkg]}.${cls.name}.html${ANSI_RESET}`;
				}

				return `${ANSI_CYAN}[${cls.name}]${ANSI_RESET} - see docs to explore all members: ${BASE_URL}/classes/${PACKAGE_MAP[pkg]}.${cls.name}.html`;
			} satisfies Inspect,
			enumerable: false,
		});
	};
}
