import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const resourcesDirectory = path.join(projectRoot, 'src/lib/content/resources');
const allowedFields = new Set([
	'slug',
	'name',
	'description',
	'url',
	'github',
	'npm',
	'kinds',
	'categories',
	'tags',
	'featured'
]);

function fail(message) {
	throw new Error(message);
}

function validateWebUrl(value, field, slug) {
	try {
		const url = new URL(value);
		if (url.protocol !== 'http:' && url.protocol !== 'https:') fail('');
	} catch {
		fail(`Resource "${slug}" must have a valid ${field} URL.`);
	}
}

function validateStringArray(resource, field, allowEmpty = false) {
	const values = resource[field];

	if (!Array.isArray(values) || (!allowEmpty && values.length === 0)) {
		fail(`Resource "${resource.slug}" must have a non-empty ${field} array.`);
	}

	if (values.some((value) => typeof value !== 'string' || !value.trim())) {
		fail(`Resource "${resource.slug}" has an invalid value in ${field}.`);
	}

	if (new Set(values).size !== values.length) {
		fail(`Resource "${resource.slug}" has duplicate values in ${field}.`);
	}
}

function validateResource(resource, index) {
	if (!resource || typeof resource !== 'object' || Array.isArray(resource)) {
		fail(`Entry ${index + 1} must be a JSON object.`);
	}

	for (const field of Object.keys(resource)) {
		if (!allowedFields.has(field))
			fail(`Resource entry ${index + 1} has unknown field "${field}".`);
	}

	for (const field of ['slug', 'name', 'description', 'url']) {
		if (typeof resource[field] !== 'string' || !resource[field].trim()) {
			fail(`Resource entry ${index + 1} must have a non-empty ${field}.`);
		}
	}

	if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(resource.slug)) {
		fail(`Resource slug "${resource.slug}" must use lowercase kebab-case.`);
	}

	validateWebUrl(resource.url, 'url', resource.slug);
	if (resource.github !== undefined) validateWebUrl(resource.github, 'github', resource.slug);

	if (resource.npm !== undefined && (typeof resource.npm !== 'string' || !resource.npm.trim())) {
		fail(`Resource "${resource.slug}" must have a valid npm package name.`);
	}

	if (resource.featured !== undefined && typeof resource.featured !== 'boolean') {
		fail(`Resource "${resource.slug}" must have a boolean featured value.`);
	}

	validateStringArray(resource, 'kinds');
	validateStringArray(resource, 'categories');
	validateStringArray(resource, 'tags', true);
}

function quote(value) {
	return `'${value
		.replaceAll('\\', '\\\\')
		.replaceAll("'", "\\'")
		.replaceAll('\r', '\\r')
		.replaceAll('\n', '\\n')}'`;
}

function formatValue(value) {
	if (typeof value === 'string') return quote(value);
	if (typeof value === 'boolean') return String(value);
	return `[${value.map(quote).join(', ')}]`;
}

function createResourceModule(resource) {
	const fieldOrder = [
		'slug',
		'name',
		'description',
		'url',
		'github',
		'npm',
		'kinds',
		'categories',
		'tags',
		'featured'
	];
	const fields = fieldOrder
		.filter((field) => resource[field] !== undefined)
		.map((field) => `\t${field}: ${formatValue(resource[field])}`)
		.join(',\n');

	return `import type { Resource } from '../schema';\n\nexport default {\n${fields}\n} satisfies Resource;\n`;
}

async function rollback(files) {
	await Promise.all(files.map((file) => unlink(file).catch(() => undefined)));
}

async function main() {
	const inputPath = path.resolve(process.cwd(), process.argv[2] ?? 'resource.json');
	let input;

	try {
		input = JSON.parse(await readFile(inputPath, 'utf8'));
	} catch (error) {
		fail(`Could not read valid JSON from ${inputPath}: ${error.message}`);
	}

	const resources = Array.isArray(input) ? input : [input];
	if (resources.length === 0) fail('The input array must contain at least one resource.');

	resources.forEach(validateResource);

	const slugs = resources.map((resource) => resource.slug);
	if (new Set(slugs).size !== slugs.length) fail('The input contains duplicate resource slugs.');

	const outputFiles = resources.map((resource) =>
		path.join(resourcesDirectory, `${resource.slug}.ts`)
	);
	const existingSlugs = resources
		.filter((_, index) => existsSync(outputFiles[index]))
		.map((resource) => resource.slug);

	if (existingSlugs.length > 0) {
		const resourceLabel =
			existingSlugs.length === 1 ? 'resource already exists' : 'resources already exist';
		const resourceList = existingSlugs.map((slug) => `- ${slug}`).join('\n');
		fail(`${existingSlugs.length} ${resourceLabel}:\n${resourceList}\n\nNo resources were added.`);
	}

	await mkdir(resourcesDirectory, { recursive: true });
	const createdFiles = [];

	try {
		for (let index = 0; index < resources.length; index += 1) {
			await writeFile(outputFiles[index], createResourceModule(resources[index]), { flag: 'wx' });
			createdFiles.push(outputFiles[index]);
		}

		const check = spawnSync('pnpm', ['check'], {
			cwd: projectRoot,
			stdio: 'inherit'
		});

		if (check.error || check.status !== 0) {
			fail('Project validation failed.');
		}
	} catch (error) {
		await rollback(createdFiles);
		fail(`${error.message} Newly created resource files were removed.`);
	}

	console.log(`Added ${resources.length} resource${resources.length === 1 ? '' : 's'}:`);
	for (const resource of resources) console.log(`- ${resource.slug}`);
}

main().catch((error) => {
	console.error(`\n${error.message}`);
	process.exitCode = 1;
});
