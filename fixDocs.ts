// TypDoc does not link cross-module references. So I use this rough patch to fix it.

import * as fs from 'fs';
import { join } from 'path';
import parse from 'node-html-parser';

const DOCS_PATH = './docs';
const PACKAGES_PATH = './packages';
const CURRENT_HOST = '../../docs';
const TARGET_HOST = 'https://stimulcross.github.io/donation-alerts';

const HTML_REGEX = /[A-z-._0-9]*.html$/iu;

const UNRESOLVED_TYPE_REGEX = /(<span class="tsd-signature-type">([A-z0-9_]*)<\/span>)/gu;

const TYPES_MAP = new Map<string, string>([
	['classes', 'Class'],
	['interfaces', 'Interface'],
	['types', 'Type alias'],
	['functions', 'Function']
]);

function createLink(name: string, path: string, type: string): string {
	return `<a href="${path}" class="tsd-signature-type" data-tsd-kind="${TYPES_MAP.get(type)!}">${name}</a>`;
}

export async function fixDocs(): Promise<void> {
	const linksMap = new Map<string, string>();
	const typesMap = new Map<string, string>();
	const docsDir = await fs.promises.readdir('./docs');

	// MAP ELEMENTS TO THEIR RELATIVE PATHS
	for (const el of docsDir) {
		if (['classes', 'functions', 'interfaces', 'types'].includes(el)) {
			const elements = await fs.promises.readdir(join(DOCS_PATH, el));

			for (const file of elements) {
				if (HTML_REGEX.test(file)) {
					const docFile = (await fs.promises.readFile(join(DOCS_PATH, el, file))).toString();
					const document = parse(docFile);

					const list = document.querySelector('.tsd-breadcrumb');

					if (list?.lastChild) {
						// @ts-ignore TYPES...
						if (list.lastChild.childNodes[0]?.childNodes[0]?._rawText) {
							// @ts-ignore TYPES...
							linksMap.set(list.lastChild.childNodes[0]?.childNodes[0].rawText, `../${el}/${file}`);
							// @ts-ignore TYPES...
							typesMap.set(list.lastChild.childNodes[0]?.childNodes[0].rawText, el);
						}
					}
				}
			}
		}
	}

	// @ts-ignore THESE CONSTANTS CAN BE DIFFERENT
	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	if (CURRENT_HOST !== TARGET_HOST) {
		// REPLACE OLD HOST WITH NEW ONE IN HTML files and README.md
		for (const el of docsDir) {
			if (el === 'modules') {
				const modules = await fs.promises.readdir(join(DOCS_PATH, el));

				for (const m of modules) {
					if (HTML_REGEX.test(m)) {
						const mod = await fs.promises.readFile(join(DOCS_PATH, el, m));
						let htmlDoc = mod.toString();
						// @ts-ignore BLA BLA BLA
						// eslint-disable-next-line @typescript-eslint/no-unsafe-call
						htmlDoc = htmlDoc.replaceAll(CURRENT_HOST, TARGET_HOST) as string;
						await fs.promises.writeFile(join(DOCS_PATH, el, m), htmlDoc);
					}
				}
			}
		}

		const packagesDir = await fs.promises.readdir('packages');

		for (const pkg of packagesDir) {
			const pkgDir = await fs.promises.readdir(join(PACKAGES_PATH, pkg));

			if (pkgDir.includes('README.md')) {
				const readme = await fs.promises.readFile(join(PACKAGES_PATH, pkg, 'README.md'));
				let readmeDoc = readme.toString();
				// @ts-ignore BLA BLA BLA
				// eslint-disable-next-line @typescript-eslint/no-unsafe-call
				readmeDoc = readmeDoc.replaceAll(CURRENT_HOST, TARGET_HOST) as string;
				await fs.promises.writeFile(join(PACKAGES_PATH, pkg, 'README.md'), readmeDoc);
			}
		}
	}

	// TRYING TO RESOLVE UNRESOLVED TYPES
	for (const el of docsDir) {
		if (['classes', 'functions', 'interfaces', 'types'].includes(el)) {
			const elements = await fs.promises.readdir(join(DOCS_PATH, el));

			for (const file of elements) {
				if (HTML_REGEX.test(file)) {
					let docFile = (await fs.promises.readFile(join(DOCS_PATH, el, file))).toString();

					do {
						const matched = UNRESOLVED_TYPE_REGEX.exec(docFile);
						if (!matched) {
							break;
						}

						if (linksMap.has(matched[2])) {
							docFile = docFile.replace(
								matched[0],
								createLink(matched[2], linksMap.get(matched[2])!, typesMap.get(matched[2])!)
							);

							await fs.promises.writeFile(join(DOCS_PATH, el, file), docFile);
						}
						// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition,no-constant-condition
					} while (true);

					// @ts-ignore BLA BLA
					// eslint-disable-next-line @typescript-eslint/no-unsafe-call
					docFile = docFile.replaceAll(
						'<h3>Throws</h3><p>HttpError',
						'<h3>Throws</h3><p><a href="../classes/api_call.HttpError.html" class="tsd-signature-type" data-tsd-kind="Class">HttpError</a>'
					) as string;

					// @ts-ignore BLA BLA
					// eslint-disable-next-line @typescript-eslint/no-unsafe-call
					docFile = docFile.replaceAll(
						'<h3>Throws</h3><p>MissingScopeError',
						'<h3>Throws</h3><p><a href="../classes/auth.MissingScopeError.html" class="tsd-signature-type" data-tsd-kind="Class">MissingScopeError</a>'
					) as string;

					// @ts-ignore BLA BLA
					// eslint-disable-next-line @typescript-eslint/no-unsafe-call
					docFile = docFile.replaceAll(
						'<h3>Throws</h3><p>UnregisteredUserError',
						'<h3>Throws</h3><p><a href="../classes/auth.UnregisteredUserError.html" class="tsd-signature-type" data-tsd-kind="Class">UnregisteredUserError</a>'
					) as string;

					await fs.promises.writeFile(join(DOCS_PATH, el, file), docFile);
				}
			}
		}
	}
}

void fixDocs();
