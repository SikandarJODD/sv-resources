import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const resourcesDirectory = path.join(projectRoot, 'src/lib/content/resources');
const schemaPath = path.join(projectRoot, 'src/lib/content/schema.ts');
const allowedFields = new Set([
	'slug',
	'name',
	'description',
	'url',
	'icon',
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

function readOptionValue(args, index, option) {
	const value = args[index + 1];
	if (!value || value.startsWith('--')) fail(`${option} requires a value.`);
	return value;
}

function parseArguments(args) {
	const options = {
		input: undefined,
		unknownValues: 'error',
		skipInvalid: false,
		skipExisting: false,
		dryRun: false,
		help: false
	};

	for (let index = 0; index < args.length; index += 1) {
		const argument = args[index];

		if (argument === '--') continue;
		if (argument === '--help' || argument === '-h') {
			options.help = true;
			continue;
		}
		if (argument === '--skip-invalid') {
			options.skipInvalid = true;
			continue;
		}
		if (argument === '--skip-existing') {
			options.skipExisting = true;
			continue;
		}
		if (argument === '--dry-run') {
			options.dryRun = true;
			continue;
		}

		if (argument === '--input') {
			if (options.input !== undefined) fail('The input path was provided more than once.');
			options.input = readOptionValue(args, index, '--input');
			index += 1;
			continue;
		}
		if (argument.startsWith('--input=')) {
			if (options.input !== undefined) fail('The input path was provided more than once.');
			options.input = argument.slice('--input='.length);
			if (!options.input) fail('--input requires a value.');
			continue;
		}

		if (argument === '--unknown-values') {
			options.unknownValues = readOptionValue(args, index, '--unknown-values');
			index += 1;
			continue;
		}
		if (argument.startsWith('--unknown-values=')) {
			options.unknownValues = argument.slice('--unknown-values='.length);
			continue;
		}

		if (argument.startsWith('-')) fail(`Unknown option "${argument}".`);
		if (options.input !== undefined) fail('The input path was provided more than once.');
		options.input = argument;
	}

	if (!['error', 'drop'].includes(options.unknownValues)) {
		fail('--unknown-values must be either "error" or "drop".');
	}

	return options;
}

function extractSchemaValues(source, pattern, label) {
	const declaration = source.match(pattern)?.[1];
	if (!declaration) fail(`Could not read valid ${label} from ${schemaPath}.`);

	const values = [...declaration.matchAll(/'([^']+)'|"([^"]+)"/g)].map(
		(match) => match[1] ?? match[2]
	);
	if (values.length === 0 || new Set(values).size !== values.length) {
		fail(`Could not read valid ${label} from ${schemaPath}.`);
	}

	return values;
}

async function loadSchemaValues() {
	const source = await readFile(schemaPath, 'utf8');
	return {
		kinds: extractSchemaValues(
			source,
			/export\s+type\s+ResourceKind\s*=\s*([\s\S]*?);/,
			'resource kinds'
		),
		categories: extractSchemaValues(
			source,
			/export\s+const\s+resourceCategories\s*=\s*\[([\s\S]*?)\]\s*as const\s*;/,
			'resource categories'
		)
	};
}

function printHelp(schemaValues) {
	console.log(`Usage: pnpm resource:add -- [input.json] [options]

Options:
  --input <file>                 Input file (default: resource.json)
  --unknown-values <error|drop>  Reject or remove unknown kinds/categories
  --skip-invalid                 Skip invalid resource entries
  --skip-existing                Skip slugs that already exist
  --dry-run                      Validate without writing files
  -h, --help                     Show this help

Valid kinds: ${schemaValues.kinds.join(', ')}
Valid categories: ${schemaValues.categories.join(', ')}`);
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
	if (resource.icon !== undefined) validateWebUrl(resource.icon, 'icon', resource.slug);
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

function dropOrRejectUnknownValues(resource, schemaValues, mode) {
	const cleaned = { ...resource };
	const dropped = {};

	for (const [field, allowedValues] of [
		['kinds', schemaValues.kinds],
		['categories', schemaValues.categories]
	]) {
		const allowed = new Set(allowedValues);
		const unknown = resource[field].filter((value) => !allowed.has(value));
		if (unknown.length === 0) continue;

		if (mode === 'error') {
			fail(
				`Resource "${resource.slug}" has unsupported ${field}: ${unknown.join(', ')}. ` +
					`Valid ${field}: ${allowedValues.join(', ')}.`
			);
		}

		cleaned[field] = resource[field].filter((value) => allowed.has(value));
		dropped[field] = unknown;
		if (cleaned[field].length === 0) {
			fail(`Resource "${resource.slug}" has no supported ${field} after dropping unknown values.`);
		}
	}

	return { resource: cleaned, dropped };
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
		'icon',
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

function printImportDetails(droppedValues, invalidResources, existingResources) {
	if (droppedValues.length > 0) {
		console.log('\nDropped unsupported values:');
		for (const { slug, values } of droppedValues) {
			const details = Object.entries(values)
				.map(([field, dropped]) => `${field} [${dropped.join(', ')}]`)
				.join('; ');
			console.log(`- ${slug}: ${details}`);
		}
	}

	if (invalidResources.length > 0) {
		console.log('\nSkipped invalid resources:');
		for (const resource of invalidResources) console.log(`- ${resource}`);
	}

	if (existingResources.length > 0) {
		console.log('\nSkipped existing resources:');
		for (const slug of existingResources) console.log(`- ${slug}`);
	}
}

async function main() {
	const options = parseArguments(process.argv.slice(2));
	const schemaValues = await loadSchemaValues();
	if (options.help) {
		printHelp(schemaValues);
		return;
	}

	const inputPath = path.resolve(process.cwd(), options.input ?? 'resource.json');
	let input;

	try {
		input = JSON.parse(await readFile(inputPath, 'utf8'));
	} catch (error) {
		fail(`Could not read valid JSON from ${inputPath}: ${error.message}`);
	}

	const inputResources = Array.isArray(input) ? input : [input];
	if (inputResources.length === 0) fail('The input array must contain at least one resource.');

	const resources = [];
	const droppedValues = [];
	const invalidResources = [];
	const seenSlugs = new Set();

	for (let index = 0; index < inputResources.length; index += 1) {
		const inputResource = inputResources[index];

		try {
			validateResource(inputResource, index);
			if (seenSlugs.has(inputResource.slug)) {
				fail(`Resource "${inputResource.slug}" is duplicated in the input.`);
			}

			const prepared = dropOrRejectUnknownValues(
				inputResource,
				schemaValues,
				options.unknownValues
			);
			seenSlugs.add(inputResource.slug);
			resources.push(prepared.resource);
			if (Object.keys(prepared.dropped).length > 0) {
				droppedValues.push({ slug: inputResource.slug, values: prepared.dropped });
			}
		} catch (error) {
			if (!options.skipInvalid) throw error;
			const label =
				inputResource && typeof inputResource.slug === 'string'
					? inputResource.slug
					: `entry ${index + 1}`;
			invalidResources.push(`${label}: ${error.message}`);
		}
	}

	const outputFiles = resources.map((resource) =>
		path.join(resourcesDirectory, `${resource.slug}.ts`)
	);
	const existingSlugs = resources
		.filter((_, index) => existsSync(outputFiles[index]))
		.map((resource) => resource.slug);

	if (existingSlugs.length > 0 && !options.skipExisting) {
		const resourceLabel =
			existingSlugs.length === 1 ? 'resource already exists' : 'resources already exist';
		const resourceList = existingSlugs.map((slug) => `- ${slug}`).join('\n');
		fail(`${existingSlugs.length} ${resourceLabel}:\n${resourceList}\n\nNo resources were added.`);
	}

	const resourcesToAdd = options.skipExisting
		? resources.filter((resource) => !existingSlugs.includes(resource.slug))
		: resources;
	const filesToAdd = resourcesToAdd.map((resource) =>
		path.join(resourcesDirectory, `${resource.slug}.ts`)
	);

	if (options.dryRun) {
		console.log(
			`Would add ${resourcesToAdd.length} resource${resourcesToAdd.length === 1 ? '' : 's'}:`
		);
		for (const resource of resourcesToAdd) console.log(`- ${resource.slug}`);
		printImportDetails(droppedValues, invalidResources, options.skipExisting ? existingSlugs : []);
		return;
	}

	await mkdir(resourcesDirectory, { recursive: true });
	const createdFiles = [];

	try {
		for (let index = 0; index < resourcesToAdd.length; index += 1) {
			await writeFile(filesToAdd[index], createResourceModule(resourcesToAdd[index]), {
				flag: 'wx'
			});
			createdFiles.push(filesToAdd[index]);
		}

		if (resourcesToAdd.length > 0) {
			const check = spawnSync('pnpm', ['check'], {
				cwd: projectRoot,
				stdio: 'inherit'
			});

			if (check.error || check.status !== 0) {
				fail('Project validation failed.');
			}
		}
	} catch (error) {
		await rollback(createdFiles);
		fail(`${error.message} Newly created resource files were removed.`);
	}

	console.log(`Added ${resourcesToAdd.length} resource${resourcesToAdd.length === 1 ? '' : 's'}:`);
	for (const resource of resourcesToAdd) console.log(`- ${resource.slug}`);
	printImportDetails(droppedValues, invalidResources, options.skipExisting ? existingSlugs : []);
}

main().catch((error) => {
	console.error(`\n${error.message}`);
	process.exitCode = 1;
});
