<script>
	import { Checkbox } from '$lib/components/ui/checkbox';
	import Hitbox from '$lib/components/ui/hitbox';
</script>

<div class="flex items-center gap-8">
	<div class="flex flex-col items-center gap-4">
		<Hitbox radius="none" debug>
			<Checkbox />
		</Hitbox>
		<p class="text-sm text-muted-foreground">none</p>
	</div>
	<div class="flex flex-col items-center gap-4">
		<Hitbox radius="sm" debug>
			<Checkbox />
		</Hitbox>
		<p class="text-sm text-muted-foreground">sm</p>
	</div>
	<div class="flex flex-col items-center gap-4">
		<Hitbox radius="md" debug>
			<Checkbox />
		</Hitbox>
		<p class="text-sm text-muted-foreground">md</p>
	</div>
	<div class="flex flex-col items-center gap-4">
		<Hitbox radius="lg" debug>
			<Checkbox />
		</Hitbox>
		<p class="text-sm text-muted-foreground">lg</p>
	</div>
	<div class="flex flex-col items-center gap-4">
		<Hitbox radius="full" debug>
			<Checkbox />
		</Hitbox>
		<p class="text-sm text-muted-foreground">full</p>
	</div>
</div>
