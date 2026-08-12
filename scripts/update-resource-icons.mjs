import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const resourcesDirectory = path.join(projectRoot, 'src/lib/content/resources');
const requestTimeout = 10_000;
const defaultConcurrency = 5;
const requestHeaders = {
	accept: 'text/html,application/xhtml+xml,image/*;q=0.9,*/*;q=0.8',
	'user-agent': 'sv-resources-icon-checker/1.0'
};

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
		dryRun: false,
		refresh: false,
		concurrency: defaultConcurrency,
		help: false
	};

	for (let index = 0; index < args.length; index += 1) {
		const argument = args[index];

		if (argument === '--') continue;
		if (argument === '--help' || argument === '-h') {
			options.help = true;
			continue;
		}
		if (argument === '--dry-run') {
			options.dryRun = true;
			continue;
		}
		if (argument === '--refresh') {
			options.refresh = true;
			continue;
		}

		if (argument === '--concurrency') {
			options.concurrency = Number(readOptionValue(args, index, '--concurrency'));
			index += 1;
			continue;
		}
		if (argument.startsWith('--concurrency=')) {
			options.concurrency = Number(argument.slice('--concurrency='.length));
			continue;
		}

		fail(`Unknown option "${argument}".`);
	}

	if (!Number.isInteger(options.concurrency) || options.concurrency < 1) {
		fail('--concurrency must be a positive integer.');
	}

	return options;
}

function printHelp() {
	console.log(`Usage: pnpm resource:icons -- [options]

Discovers and stores favicon URLs for resources. Existing valid icons are kept.

Options:
  --dry-run          Show changes without updating resource files
  --refresh          Rediscover icons even when the current icon still works
  --concurrency <n>  Number of websites checked at once (default: ${defaultConcurrency})
  -h, --help         Show this help`);
}

function decodeQuotedValue(value) {
	return value.replace(/\\([\\'"rn])/g, (_, character) => {
		if (character === 'n') return '\n';
		if (character === 'r') return '\r';
		return character;
	});
}

function readStringField(source, field) {
	const pattern = new RegExp(
		`^\\s*${field}:\\s*(?:'((?:\\\\.|[^'])*)'|"((?:\\\\.|[^"])*)")\\s*,?\\s*$`,
		'm'
	);
	const match = source.match(pattern);
	const value = match?.[1] ?? match?.[2];
	return value === undefined ? undefined : decodeQuotedValue(value);
}

function quote(value) {
	return `'${value
		.replaceAll('\\', '\\\\')
		.replaceAll("'", "\\'")
		.replaceAll('\r', '\\r')
		.replaceAll('\n', '\\n')}'`;
}

function setIconField(source, icon) {
	const newline = source.includes('\r\n') ? '\r\n' : '\n';
	const lines = source.split(/\r?\n/);
	const iconIndex = lines.findIndex((line) => /^\s*icon:\s*/.test(line));

	if (iconIndex >= 0) {
		const indentation = lines[iconIndex].match(/^\s*/)?.[0] ?? '\t';
		lines[iconIndex] = `${indentation}icon: ${quote(icon)},`;
		return lines.join(newline);
	}

	const urlIndex = lines.findIndex((line) => /^\s*url:\s*/.test(line));
	if (urlIndex < 0) fail('Could not find the url field.');

	const indentation = lines[urlIndex].match(/^\s*/)?.[0] ?? '\t';
	lines.splice(urlIndex + 1, 0, `${indentation}icon: ${quote(icon)},`);
	return lines.join(newline);
}

async function fetchWithTimeout(url, options = {}) {
	return fetch(url, {
		redirect: 'follow',
		...options,
		headers: { ...requestHeaders, ...options.headers },
		signal: AbortSignal.timeout(requestTimeout)
	});
}

function readAttributes(tag) {
	const attributes = {};
	const pattern = /([^\s=]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g;

	for (const match of tag.matchAll(pattern)) {
		attributes[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? '';
	}

	return attributes;
}

function scoreIcon(attributes, iconUrl) {
	const rel = attributes.rel.toLowerCase();
	let score = rel.split(/\s+/).includes('icon') ? 100 : 50;
	const pathname = iconUrl.pathname.toLowerCase();
	const type = attributes.type?.toLowerCase() ?? '';

	if (type.includes('svg') || pathname.endsWith('.svg')) score += 30;
	else if (type.includes('png') || pathname.endsWith('.png')) score += 20;
	else if (pathname.endsWith('.ico')) score += 10;

	const sizes = attributes.sizes?.match(/(\d+)x(\d+)/gi) ?? [];
	const largestSize = Math.max(
		0,
		...sizes.map((size) => {
			const [width, height] = size.toLowerCase().split('x').map(Number);
			return width * height;
		})
	);

	return score + Math.min(largestSize / 1024, 20);
}

function extractIconCandidates(html, pageUrl) {
	const candidates = [];

	for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
		const attributes = readAttributes(match[0]);
		if (!attributes.href || !attributes.rel) continue;

		const rel = attributes.rel.toLowerCase();
		if (!rel.includes('icon')) continue;

		try {
			const iconUrl = new URL(attributes.href.replaceAll('&amp;', '&'), pageUrl);
			if (!['http:', 'https:'].includes(iconUrl.protocol)) continue;
			candidates.push({ url: iconUrl.href, score: scoreIcon(attributes, iconUrl) });
		} catch {}
	}

	return candidates.sort((a, b) => b.score - a.score).map((candidate) => candidate.url);
}

async function isWorkingIcon(iconUrl) {
	try {
		const response = await fetchWithTimeout(iconUrl, {
			headers: { accept: 'image/*,*/*;q=0.8' }
		});
		const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
		const pathname = new URL(response.url || iconUrl).pathname;
		const hasImageExtension = /\.(?:ico|png|svg|jpe?g|webp|gif)$/i.test(pathname);
		await response.body?.cancel();

		return (
			response.ok &&
			(contentType.startsWith('image/') ||
				(hasImageExtension && !contentType.includes('text/html')))
		);
	} catch {
		return false;
	}
}

async function discoverIcon(resourceUrl) {
	let pageUrl = new URL(resourceUrl);
	let candidates = [];

	try {
		const response = await fetchWithTimeout(pageUrl.href);
		pageUrl = new URL(response.url || pageUrl.href);

		if (response.ok) {
			const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
			if (contentType.includes('text/html') || contentType.includes('application/xhtml+xml')) {
				candidates = extractIconCandidates(await response.text(), pageUrl);
			} else {
				await response.body?.cancel();
			}
		} else {
			await response.body?.cancel();
		}
	} catch {}

	candidates.push(new URL('/favicon.ico', pageUrl).href);

	for (const candidate of [...new Set(candidates)]) {
		if (await isWorkingIcon(candidate)) return candidate;
	}

	return undefined;
}

async function mapWithConcurrency(items, concurrency, mapper) {
	const results = new Array(items.length);
	let nextIndex = 0;

	async function worker() {
		while (nextIndex < items.length) {
			const currentIndex = nextIndex;
			nextIndex += 1;
			results[currentIndex] = await mapper(items[currentIndex]);
		}
	}

	await Promise.all(
		Array.from({ length: Math.min(concurrency, items.length) }, () => worker())
	);
	return results;
}

async function processResource(file, options) {
	const filePath = path.join(resourcesDirectory, file);
	const source = await readFile(filePath, 'utf8');
	const slug = readStringField(source, 'slug') ?? path.basename(file, '.ts');
	const resourceUrl = readStringField(source, 'url');
	const currentIcon = readStringField(source, 'icon');

	if (!resourceUrl) return { slug, status: 'failed', message: 'missing resource URL' };

	if (currentIcon && !options.refresh && (await isWorkingIcon(currentIcon))) {
		return { slug, status: 'unchanged', icon: currentIcon };
	}

	let discoveredIcon;
	try {
		discoveredIcon = await discoverIcon(resourceUrl);
	} catch {
		return { slug, status: 'failed', message: 'invalid resource URL' };
	}

	if (!discoveredIcon) return { slug, status: 'failed', message: 'no working icon found' };
	if (discoveredIcon === currentIcon) return { slug, status: 'unchanged', icon: currentIcon };

	if (!options.dryRun) {
		await writeFile(filePath, setIconField(source, discoveredIcon));
	}

	return { slug, status: 'updated', icon: discoveredIcon };
}

function printResults(results, dryRun) {
	const updated = results.filter((result) => result.status === 'updated');
	const unchanged = results.filter((result) => result.status === 'unchanged');
	const failed = results.filter((result) => result.status === 'failed');

	if (updated.length > 0) {
		console.log(dryRun ? 'Icons that would be updated:' : 'Updated icons:');
		for (const result of updated) console.log(`- ${result.slug}: ${result.icon}`);
	}

	if (failed.length > 0) {
		console.log('\nIcons that could not be resolved:');
		for (const result of failed) console.log(`- ${result.slug}: ${result.message}`);
	}

	console.log(
		`\n${dryRun ? 'Would update' : 'Updated'} ${updated.length}, kept ${unchanged.length}, ` +
			`and could not resolve ${failed.length}.`
	);
}

async function main() {
	const options = parseArguments(process.argv.slice(2));
	if (options.help) {
		printHelp();
		return;
	}

	const files = (await readdir(resourcesDirectory))
		.filter((file) => file.endsWith('.ts'))
		.sort();
	const results = await mapWithConcurrency(files, options.concurrency, (file) =>
		processResource(file, options)
	);

	printResults(results, options.dryRun);
}

main().catch((error) => {
	console.error(`\n${error.message}`);
	process.exitCode = 1;
});
