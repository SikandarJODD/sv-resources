<script lang="ts">
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import SearchXIcon from '@lucide/svelte/icons/search-x';
	import { Button } from '$lib/components/ui/button';
	import * as Empty from '$lib/components/ui/empty';

	let { query }: { query: string } = $props();

	const addResourceUrl =
		'https://github.com/SikandarJODD/sv-resources/issues/new?template=add-resource.yml';
</script>

<Empty.Root class="border">
	<Empty.Header>
		<Empty.Media variant="icon">
			<SearchXIcon aria-hidden="true" />
		</Empty.Media>
		<Empty.Title>No resources found</Empty.Title>
		<Empty.Description>
			{#if query.trim()}
				No resources match “{query.trim()}”. Try another search or suggest a resource.
			{:else}
				There are no resources to show yet. You can suggest the first one.
			{/if}
		</Empty.Description>
	</Empty.Header>

	<Empty.Content>
		<Button href={addResourceUrl} target="_blank" rel="noreferrer">
			Add a resource
			<ExternalLinkIcon data-icon="inline-end" aria-hidden="true" />
		</Button>
	</Empty.Content>
</Empty.Root>
