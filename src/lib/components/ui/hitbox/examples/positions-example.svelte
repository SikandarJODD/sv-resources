<script>
	import { Checkbox } from '$lib/components/ui/checkbox';
	import Hitbox from '$lib/components/ui/hitbox';
</script>

<div class="grid grid-cols-2 gap-8 md:grid-cols-4">
	<div class="flex flex-col items-center gap-4">
		<Hitbox debug>
			<Checkbox />
		</Hitbox>
		<p class="text-sm text-muted-foreground">all</p>
	</div>
	<div class="flex flex-col items-center gap-4">
		<Hitbox position="top" debug>
			<Checkbox />
		</Hitbox>
		<p class="text-sm text-muted-foreground">top</p>
	</div>
	<div class="flex flex-col items-center gap-4">
		<Hitbox position="bottom" debug>
			<Checkbox />
		</Hitbox>
		<p class="text-sm text-muted-foreground">bottom</p>
	</div>
	<div class="flex flex-col items-center gap-4">
		<Hitbox position="left" debug>
			<Checkbox />
		</Hitbox>
		<p class="text-sm text-muted-foreground">left</p>
	</div>
	<div class="flex flex-col items-center gap-4">
		<Hitbox position="right" debug>
			<Checkbox />
		</Hitbox>
		<p class="text-sm text-muted-foreground">right</p>
	</div>
	<div class="flex flex-col items-center gap-4">
		<Hitbox position="vertical" debug>
			<Checkbox />
		</Hitbox>
		<p class="text-sm text-muted-foreground">vertical</p>
	</div>
	<div class="flex flex-col items-center gap-4">
		<Hitbox position="horizontal" debug>
			<Checkbox />
		</Hitbox>
		<p class="text-sm text-muted-foreground">horizontal</p>
	</div>
</div>
