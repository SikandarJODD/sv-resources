<script>
	import { Checkbox } from '$lib/components/ui/checkbox';
	import Hitbox from '$lib/components/ui/hitbox';
</script>

<div class="flex items-center gap-8">
	<div class="flex flex-col items-center gap-4">
		<Hitbox debug>
			<Checkbox />
		</Hitbox>
		<p class="text-sm text-muted-foreground">default</p>
	</div>
	<div class="flex flex-col items-center gap-4">
		<Hitbox size="sm" debug>
			<Checkbox />
		</Hitbox>
		<p class="text-sm text-muted-foreground">sm</p>
	</div>
	<div class="flex flex-col items-center gap-4">
		<Hitbox size="lg" debug>
			<Checkbox />
		</Hitbox>
		<p class="text-sm text-muted-foreground">lg</p>
	</div>
	<div class="flex flex-col items-center gap-4">
		<Hitbox size="10px" debug>
			<Checkbox />
		</Hitbox>
		<p class="text-sm text-muted-foreground">10px</p>
	</div>
</div>
