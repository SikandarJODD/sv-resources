<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import type { Component } from 'svelte';
	import { LibraryIcon, ComponentIcon, HomeIcon } from './icons';

	type NavItem = {
		title: string;
		url: string;
		icon: Component;
		badge?: string;
		isActive?: boolean;
	};

	let items: NavItem[] = [
		{
			title: 'Home',
			url: '/',
			icon: HomeIcon
		},
		{
			title: 'Library',
			url: '#',
			icon: LibraryIcon
		},
		{
			title: 'Components',
			url: '#',
			icon: ComponentIcon,
			isActive: true
		}
	];
</script>

<Sidebar.Group>
	<Sidebar.GroupContent>
		<Sidebar.Menu>
			{#each items as item (item.title)}
				<Sidebar.MenuItem>
					<Sidebar.MenuButton>
						{#snippet child({ props })}
							<a href={item.url} {...props}>
								<item.icon />
								<span>{item.title}</span>
							</a>
						{/snippet}
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			{/each}
		</Sidebar.Menu>
	</Sidebar.GroupContent>
</Sidebar.Group>
