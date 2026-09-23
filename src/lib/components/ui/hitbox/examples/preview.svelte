<script lang="ts">
	import { Checkbox } from '$lib/components/ui/checkbox';
	import Hitbox from '$lib/components/ui/hitbox';
</script>

<div class="flex h-screen items-center justify-center gap-8">
	<div class="flex flex-col items-center gap-4">
		<Hitbox debug>
			<Checkbox />
		</Hitbox>
		<p class="text-sm text-muted-foreground">Default Size</p>
	</div>
	<div class="flex flex-col items-center gap-4">
		<Hitbox radius="full" debug>
			<Checkbox />
		</Hitbox>
		<p class="text-sm text-muted-foreground">Full Radius</p>
	</div>
	<div class="flex flex-col items-center gap-4">
		<Hitbox position="bottom" debug>
			<Checkbox />
		</Hitbox>
		<p class="text-sm text-muted-foreground">Bottom Position</p>
	</div>
</div>
