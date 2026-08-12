<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';

	let { tag }: { tag: string } = $props();
</script>

<Badge variant="secondary">{tag}</Badge>
