<script lang="ts">
	import { GithubIcon } from '$lib/components/icons';
	import { Button } from '$lib/components/ui/button';

	let { github }: { github?: string } = $props();

	let owner = $derived.by(() => {
		if (!github) return undefined;

		try {
			const githubUrl = new URL(github);
			if (!['http:', 'https:'].includes(githubUrl.protocol)) return undefined;
			if (!['github.com', 'www.github.com'].includes(githubUrl.hostname)) return undefined;

			return githubUrl.pathname.split('/').filter(Boolean)[0];
		} catch {
			return undefined;
		}
	});
</script>

{#if github && owner}
	<Button
		href={github}
		variant="ghost"
		size="icon-sm"
		target="_blank"
		rel="noreferrer"
		aria-label="View {owner}'s repository on GitHub"
		title="GitHub repository"
	>
		<GithubIcon aria-hidden="true" />
	</Button>
{/if}
