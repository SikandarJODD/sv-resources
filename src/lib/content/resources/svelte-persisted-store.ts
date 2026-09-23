import type { Resource } from '../schema';

export default {
	slug: 'svelte-persisted-store',
	name: 'Svelte Persisted Store',
	description: 'A Svelte store that automatically synchronizes its value with localStorage or sessionStorage.',
	url: 'https://github.com/joshnuss/svelte-persisted-store',
	icon: 'https://github.githubassets.com/favicons/favicon.svg',
	github: 'https://github.com/joshnuss/svelte-persisted-store',
	npm: 'svelte-persisted-store',
	kinds: ['library'],
	categories: ['utilities', 'data'],
	tags: ['svelte', 'store', 'localstorage', 'persistence']
} satisfies Resource;
