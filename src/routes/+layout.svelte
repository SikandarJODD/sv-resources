<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { activeElement, PressedKeys } from 'runed';
	import { ModeWatcher, toggleMode } from 'mode-watcher';

	let { children } = $props();
	let keys = new PressedKeys();
	keys.onKeys(['d'], () => {
		if (
			activeElement.current?.localName !== 'input' &&
			activeElement.current?.localName !== 'textarea'
		) {
			toggleMode();
		}
	});
</script>

<ModeWatcher defaultMode="system" />
<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<Sidebar.Provider>
	<AppSidebar />
	<Sidebar.Inset>
		<div>{@render children()}</div>
	</Sidebar.Inset>
</Sidebar.Provider>
