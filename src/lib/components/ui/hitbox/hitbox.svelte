<script lang="ts" module>
	import type { WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { tv, type VariantProps } from "tailwind-variants";

	export const hitboxVariants = tv({
		base: "relative [--size-default:12px] [--size-lg:16px] [--size-sm:8px] after:absolute after:content-['']",
		variants: {
			size: {
				default: "[--size:var(--size-default)]",
				sm: "[--size:var(--size-sm)]",
				lg: "[--size:var(--size-lg)]",
				dynamic: "[--size:var(--size)]",
			},
			position: {
				all: "after:[inset:calc(-1*var(--size))]",
				top: "after:[height:var(--size)] after:[left:0] after:[right:0] after:[top:calc(-1*var(--size))]",
				bottom:
					"after:[bottom:calc(-1*var(--size))] after:[height:var(--size)] after:[left:0] after:[right:0]",
				left: "after:[bottom:0] after:[left:calc(-1*var(--size))] after:[top:0] after:[width:var(--size)]",
				right:
					"after:[bottom:0] after:[right:calc(-1*var(--size))] after:[top:0] after:[width:var(--size)]",
				vertical:
					"after:[bottom:calc(-1*var(--size))] after:[left:0] after:[right:0] after:[top:calc(-1*var(--size))]",
				horizontal:
					"after:[bottom:0] after:[left:calc(-1*var(--size))] after:[right:calc(-1*var(--size))] after:[top:0]",
			},
			radius: {
				none: "",
				sm: "after:rounded-sm",
				md: "after:rounded-md",
				lg: "after:rounded-lg",
				full: "after:rounded-full",
			},
			debug: {
				true: "after:border after:border-dashed after:border-red-500 after:bg-red-500/20",
				false: "",
			},
		},
		defaultVariants: {
			size: "default",
			position: "all",
			radius: "none",
			debug: false,
		},
	});

	type PresetSize = Exclude<VariantProps<typeof hitboxVariants>["size"], "dynamic">;

	export type HitboxSize = PresetSize | (string & {});
	export type HitboxPosition = VariantProps<typeof hitboxVariants>["position"];
	export type HitboxRadius = VariantProps<typeof hitboxVariants>["radius"];
	export type HitboxProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		size?: HitboxSize;
		position?: HitboxPosition;
		radius?: HitboxRadius;
		debug?: boolean;
		child?: Snippet<[{ props: Record<string, unknown> }]>;
	};
</script>

<script lang="ts">
	import { cn } from "$lib/utils.js";

	const presetSizes = ["default", "sm", "lg"] as const;

	let {
		ref = $bindable(null),
		class: className,
		style,
		size = "default",
		position = "all",
		radius = "none",
		debug = false,
		children,
		child,
		...restProps
	}: HitboxProps = $props();

	const isDynamicSize = $derived(!presetSizes.includes(size as (typeof presetSizes)[number]));
	const mergedStyle = $derived(isDynamicSize ? `--size: ${size};${style ? ` ${style}` : ""}` : style);
	const mergedProps = $derived({
		...restProps,
		class: cn(
			hitboxVariants({
				size: isDynamicSize ? "dynamic" : (size as PresetSize),
				position,
				radius,
				debug,
			}),
			className
		),
		style: mergedStyle,
		"data-slot": "hitbox",
	});
</script>

{#if child}
	{@render child({ props: mergedProps })}
{:else}
	<div bind:this={ref} {...mergedProps}>
		{@render children?.()}
	</div>
{/if}
