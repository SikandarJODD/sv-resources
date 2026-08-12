<script lang="ts">
	import LinkIcon from '@lucide/svelte/icons/link';

	let { url, name }: { url: string; name: string } = $props();

	let failedUrl = $state<string>();

	let faviconUrl = $derived.by(() => {
		try {
			const resourceUrl = new URL(url);
			if (!['http:', 'https:'].includes(resourceUrl.protocol)) return undefined;

			return `${resourceUrl.origin}/favicon.ico`;
		} catch {
			return undefined;
		}
	});
</script>

{#if faviconUrl && failedUrl !== faviconUrl}
	<img
		src={faviconUrl}
		alt="{name} favicon"
		class="bg-muted object-contain p-1.5"
		onerror={() => (failedUrl = faviconUrl)}
	/>
{:else}
	<LinkIcon class="size-4 text-muted-foreground" aria-hidden="true" />
{/if}
