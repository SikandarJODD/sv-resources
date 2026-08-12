<script>
	import { Checkbox } from '$lib/components/ui/checkbox';
	import Hitbox from '$lib/components/ui/hitbox';
</script>

<div class="flex items-center gap-8">
	<div class="flex flex-col items-center gap-4">
		<Hitbox debug={false}>
			<Checkbox />
		</Hitbox>
		<p class="text-sm text-muted-foreground">debug=false</p>
	</div>
	<div class="flex flex-col items-center gap-4">
		<Hitbox debug>
			<Checkbox />
		</Hitbox>
		<p class="text-sm text-muted-foreground">debug=true</p>
	</div>
</div>
