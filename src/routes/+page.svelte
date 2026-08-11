<script lang="ts">
	import SearchIcon from '@lucide/svelte/icons/search';
	import XIcon from '@lucide/svelte/icons/x';
	import * as InputGroup from '$lib/components/ui/input-group';
	import { searchResources } from '$lib/content';

	let query = $state('');
	let searchResults = $derived(searchResources(query));

	function clearSearch() {
		query = '';
	}
</script>

<main>
	<InputGroup.Root>
		<InputGroup.Addon>
			<SearchIcon aria-hidden="true" />
		</InputGroup.Addon>

		<InputGroup.Input bind:value={query} type="text" placeholder="Search resources..." />

		{#if query}
			<InputGroup.Addon align="inline-end">
				<InputGroup.Button size="icon-xs" aria-label="Clear search" onclick={clearSearch}>
					<XIcon aria-hidden="true" />
				</InputGroup.Button>
			</InputGroup.Addon>
		{/if}
	</InputGroup.Root>

	{#if searchResults.length > 0}
		<ul>
			{#each searchResults as resource (resource.slug)}
				<li>
					<a href={resource.url} target="_blank" rel="noreferrer">{resource.name}</a>
					<p>{resource.description}</p>
				</li>
			{/each}
		</ul>
	{:else}
		<p>No resources found.</p>
	{/if}
</main>
