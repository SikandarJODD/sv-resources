<script lang="ts">
	import SearchIcon from '@lucide/svelte/icons/search';
	import XIcon from '@lucide/svelte/icons/x';
	import { ResourceCard, ResourceEmptyState } from '$lib/components/blocks';
	import * as InputGroup from '$lib/components/ui/input-group';
	import * as Item from '$lib/components/ui/item';
	import { searchResources } from '$lib/content';

	let query = $state('');
	let searchResults = $derived(searchResources(query));
	let searchInput = $state<HTMLInputElement | null>(null);
	let resultsGroup = $state<HTMLDivElement | null>(null);

	function clearSearch() {
		query = '';
	}

	// Only the main library links participate in arrow-key navigation.
	function getResourceLinks() {
		return Array.from(
			resultsGroup?.querySelectorAll<HTMLAnchorElement>('[data-resource-link]') ?? []
		);
	}

	function handleSearchKeydown(event: KeyboardEvent) {
		if (event.key !== 'ArrowDown') return;

		const firstResourceLink = getResourceLinks()[0];
		if (!firstResourceLink) return;

		event.preventDefault();
		firstResourceLink.focus();
	}

	function handleResultsKeydown(event: KeyboardEvent) {
		if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
		if (
			!(event.target instanceof HTMLAnchorElement) ||
			!event.target.matches('[data-resource-link]')
		) {
			return;
		}

		const resourceLinks = getResourceLinks();
		const currentIndex = resourceLinks.indexOf(event.target);
		if (currentIndex === -1) return;

		event.preventDefault();

		// ArrowUp from the first card returns to search; Enter stays native to the link.
		if (event.key === 'ArrowUp' && currentIndex === 0) {
			searchInput?.focus();
			return;
		}

		const nextIndex = event.key === 'ArrowDown' ? currentIndex + 1 : currentIndex - 1;
		resourceLinks[nextIndex]?.focus();
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
				bind:ref={searchInput}
				bind:value={query}
				type="text"
				placeholder="Search resources..."
				aria-label="Search resources"
				onkeydown={handleSearchKeydown}
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
			<span class="font-mono">{searchResults.length}</span>
			{searchResults.length === 1 ? 'resource' : 'resources'}
		</p>
	</section>

	{#if searchResults.length > 0}
		<Item.Group bind:ref={resultsGroup} onkeydown={handleResultsKeydown}>
			{#each searchResults as resource (resource.slug)}
				<ResourceCard {resource} />
			{/each}
		</Item.Group>
	{:else}
		<ResourceEmptyState {query} />
	{/if}
</div>
