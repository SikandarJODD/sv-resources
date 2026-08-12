<script lang="ts">
	import * as Item from '$lib/components/ui/item';
	import type { Resource } from '$lib/content';
	import ResourceFavicon from './resource-favicon.svelte';
	import ResourceOwner from './resource-owner.svelte';
	import ResourceTags from './resource-tags.svelte';

	let { resource }: { resource: Resource } = $props();
</script>

<!-- Highlight the whole card whenever one of its links has keyboard focus. -->
<Item.Root
	variant="outline"
	role="listitem"
	class="items-start bg-card focus-within:border-ring focus-within:bg-accent/50 focus-within:ring-3 focus-within:ring-ring/50"
>
	<Item.Media variant="image" class="border bg-muted">
		<ResourceFavicon url={resource.url} icon={resource.icon} name={resource.name} />
	</Item.Media>

	<Item.Content class="min-w-0 gap-2">
		<div class="flex flex-wrap items-start justify-between gap-2">
			<div class="min-w-0 flex-1">
				<Item.Title>
					<a
						data-resource-link
						href={resource.url}
						target="_blank"
						rel="noreferrer"
						class="hover:underline focus-visible:underline focus-visible:outline-none"
					>
						{resource.name}
					</a>
				</Item.Title>
				<Item.Description>{resource.description}</Item.Description>
			</div>

			<Item.Actions class="max-w-full">
				<ResourceOwner github={resource.github} />
			</Item.Actions>
		</div>

		<ResourceTags tags={resource.tags} />
	</Item.Content>
</Item.Root>
