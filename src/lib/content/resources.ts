import type { Resource } from './schema';

const modules = import.meta.glob<{ default: Resource }>('./resources/*.ts', {
	eager: true
});

export const resources = Object.values(modules)
	.map((module) => module.default)
	.sort((a, b) => a.name.localeCompare(b.name));
