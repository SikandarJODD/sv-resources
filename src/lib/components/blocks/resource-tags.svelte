<script lang="ts">
	import ResourceTag from './resource-tag.svelte';

	let { tags }: { tags: string[] } = $props();
</script>

{#if tags.length > 0}
	<ul class="flex flex-wrap gap-1.5" aria-label="Tags">
		{#each tags as tag (tag)}
			<li><ResourceTag {tag} /></li>
		{/each}
	</ul>
{/if}
