<script lang="ts">
	import type { Snippet } from 'svelte';

	let { 
		variant = 'primary', 
		size = 'md', 
		onclick,
		children 
	}: { 
		variant?: 'primary' | 'ghost' | 'outline'; 
		size?: 'sm' | 'md' | 'lg';
		onclick?: (e: MouseEvent) => void;
		children: Snippet;
	} = $props();

	const baseStyles = "rounded-none font-heading uppercase tracking-widest transition-transform active:scale-95 inline-flex items-center justify-center";
	
	const variants = {
		primary: "bg-sunlit-clay text-linen hover:bg-sunlit-clay/90",
		ghost: "text-stone-500 hover:text-sunlit-clay hover:bg-stone-50",
		outline: "border border-stone-200 text-stone-600 hover:border-sunlit-clay hover:text-sunlit-clay"
	};

	const sizes = {
		sm: "px-6 py-1.5 text-[10px]",
		md: "px-8 py-2.5 text-sm",
		lg: "px-10 py-4 text-sm"
	};
</script>

<button 
	class="{baseStyles} {variants[variant]} {sizes[size]}"
	{onclick}
>
	{@render children()}
</button>
