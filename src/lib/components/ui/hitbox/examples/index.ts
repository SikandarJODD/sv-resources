import Preview from './preview.svelte';
import SizeExample from './size-example.svelte';
import PositionsExample from './positions-example.svelte';
import RadiusExample from './radius-example.svelte';
import DebugModeExample from './debug-mode-example.svelte';

export { Preview, SizeExample, PositionsExample, RadiusExample, DebugModeExample };

export let examples = [
	{
		title: 'Size',
		component: SizeExample
	},
	{
		title: 'Positions',
		component: PositionsExample
	},
	{
		title: 'Radius',
		component: RadiusExample
	},
	{
		title: 'Debug Mode',
		component: DebugModeExample
	}
];
