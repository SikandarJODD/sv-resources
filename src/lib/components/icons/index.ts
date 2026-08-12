import type { HTMLAttributes } from 'svelte/elements';

import LibraryIcon from './library-icon.svelte';
import ComponentIcon from './component-icon.svelte';
import GithubIcon from './github-icon.svelte';
import HomeIcon from './home-icon.svelte';

export interface SVGProps extends HTMLAttributes<SVGElement> {
	class?: string;
	width?: number;
	height?: number;
}

export { LibraryIcon, ComponentIcon, GithubIcon, HomeIcon };
