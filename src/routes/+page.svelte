<script lang="ts">
	import SearchIcon from '@lucide/svelte/icons/search';
	import XIcon from '@lucide/svelte/icons/x';
	import { ResourceCard, ResourceEmptyState } from '$lib/components/blocks';
	import * as InputGroup from '$lib/components/ui/input-group';
	import * as Item from '$lib/components/ui/item';
	import { searchResources } from '$lib/content';

	let query = $state('');
	let searchResults = $derived(searchResources(query));

	function clearSearch() {
		query = '';
	}
</script>

<div class="mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
	<header class="space-y-1">
		<h1 class="font-heading text-2xl font-semibold tracking-tight">Resources</h1>
		<p class="text-sm text-muted-foreground">Useful libraries, components, and tools for Svelte.</p>
	</header>

	<section class="space-y-3" aria-label="Search resources">
		<InputGroup.Root>
			<InputGroup.Addon>
				<SearchIcon aria-hidden="true" />
			</InputGroup.Addon>

			<InputGroup.Input
				bind:value={query}
				type="text"
				placeholder="Search resources..."
				aria-label="Search resources"
			/>

			{#if query}
				<InputGroup.Addon align="inline-end">
					<InputGroup.Button size="icon-xs" aria-label="Clear search" onclick={clearSearch}>
						<XIcon aria-hidden="true" />
					</InputGroup.Button>
				</InputGroup.Addon>
			{/if}
		</InputGroup.Root>

		<p class="text-sm text-muted-foreground" aria-live="polite">
			{searchResults.length}
			{searchResults.length === 1 ? 'resource' : 'resources'}
		</p>
	</section>

	{#if searchResults.length > 0}
		<Item.Group>
			{#each searchResults as resource (resource.slug)}
				<ResourceCard {resource} />
			{/each}
		</Item.Group>
	{:else}
		<ResourceEmptyState {query} />
	{/if}
</div>
