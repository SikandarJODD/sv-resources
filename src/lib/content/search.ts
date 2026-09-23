import Fuse from 'fuse.js';
import { resources } from './resources';

// Build the Fuse index once. Higher weights make matches in names and tags rank first.
const resourceSearch = new Fuse(resources, {
	keys: [
		{ name: 'name', weight: 0.5 },
		{ name: 'tags', weight: 0.25 }
		// { name: 'categories', weight: 0.15 },
		// { name: 'description', weight: 0.1 }
	],
	threshold: 0.3,
	ignoreLocation: true
});

export function searchResources(query: string) {
	// An empty query should show the complete resource list.
	const normalizedQuery = query.trim();
	if (!normalizedQuery) return resources;

	// Fuse returns result metadata, so extract each original resource from `item`.
	return resourceSearch.search(normalizedQuery).map((result) => result.item);
}
