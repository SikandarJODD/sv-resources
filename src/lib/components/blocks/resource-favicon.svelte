<script lang="ts">
	import LinkIcon from '@lucide/svelte/icons/link';

	let { url, icon, name }: { url: string; icon?: string; name: string } = $props();

	let failedUrls = $state<string[]>([]);

	function getWebUrl(value: string) {
		const parsedUrl = new URL(value);
		return ['http:', 'https:'].includes(parsedUrl.protocol) ? parsedUrl : undefined;
	}

	let faviconUrls = $derived.by(() => {
		const urls: string[] = [];

		if (icon) {
			try {
				const iconUrl = getWebUrl(icon);
				if (iconUrl) urls.push(iconUrl.href);
			} catch {}
		}

		try {
			const resourceUrl = getWebUrl(url);
			if (resourceUrl) urls.push(`${resourceUrl.origin}/favicon.ico`);
		} catch {}

		return [...new Set(urls)];
	});

	let faviconUrl = $derived(faviconUrls.find((candidate) => !failedUrls.includes(candidate)));
</script>

{#if faviconUrl}
	<img
		src={faviconUrl}
		alt="{name} favicon"
		class="bg-muted object-contain p-1.5"
		onerror={() => (failedUrls = [...failedUrls, faviconUrl])}
	/>
{:else}
	<LinkIcon class="size-4 text-muted-foreground" aria-hidden="true" />
{/if}
