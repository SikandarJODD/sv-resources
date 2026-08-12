export type ResourceKind = 'library' | 'component-library' | 'component-collection' | 'tool';

export const resourceCategories = [
	'ui',
	'forms',
	'animation',
	'charts',
	'icons',
	'authentication',
	'state-management',
	'testing',
	'utilities',
	'data'
] as const;

export type ResourceCategory = (typeof resourceCategories)[number];

export type Resource = {
	slug: string;
	name: string;
	description: string;
	url: string;
	icon?: string;
	github?: string;
	npm?: string;
	kinds: ResourceKind[];
	categories: ResourceCategory[];
	tags: string[];
	featured?: boolean;
};
