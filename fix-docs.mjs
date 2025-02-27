import fs from 'fs/promises';
import { join } from 'path';

const DOCS_PATH = './docs';
const HTML_REGEX = /[A-z-._0-9]*.html$/i;
const DOCS_DIR = await fs.readdir('./docs');
const TARGET_DIRS = new Set(['classes', 'functions']);

console.log('Fixing error references...');

for (const dir of DOCS_DIR) {
	if (TARGET_DIRS.has(dir)) {
		const elements = await fs.readdir(join(DOCS_PATH, dir));

		for (const file of elements) {
			if (HTML_REGEX.test(file)) {
				let docFile = (await fs.readFile(join(DOCS_PATH, dir, file))).toString();

				if (docFile.includes('<p>HttpError')) {
					console.log(`Fixing HttpError in ${dir}/${file} ...`);
					docFile = docFile.replaceAll(
						'<p>HttpError',
						'<p><a href="../classes/api-call.HttpError.html" class="tsd-kind-class">HttpError</a>',
					);
				}

				if (docFile.includes('<p>MissingScopeError')) {
					console.log(`Fixing MissingScopeError in ${dir}/${file} ...`);
					docFile = docFile.replaceAll(
						'<p>MissingScopeError',
						'<p><a href="../classes/auth.MissingScopeError.html" class="tsd-kind-class">MissingScopeError</a>',
					);
				}

				if (docFile.includes('<p>UnregisteredUserError')) {
					console.log(`Fixing UnregisteredUserError in ${dir}/${file} ...`);
					docFile = docFile.replaceAll(
						'<p>UnregisteredUserError',
						'<p><a href="../classes/auth.UnregisteredUserError.html" class="tsd-kind-class">UnregisteredUserError</a>',
					);
				}

				await fs.writeFile(join(DOCS_PATH, dir, file), docFile);
			}
		}
	}
}

console.log('Done!');
