<script lang="ts">
	let { 
		icon, 
		label, 
		active = false,
		variant = 'ghost', 
		onclick 
	}: { 
		icon: string; 
		label?: string; 
		active?: boolean;
		variant?: 'ghost' | 'nav';
		onclick?: (e: MouseEvent) => void;
	} = $props();

	const variants = {
		ghost: "p-2 transition-colors rounded-none",
		nav: "flex flex-col items-center active:scale-95 transition-transform"
	};
</script>

<button 
	class="{variants[variant]} {active ? 'text-sunlit-clay' : 'text-stone-500 hover:text-sunlit-clay'}" 
	{onclick} 
	aria-label={label}
>
	<span class="{icon} block {variant === 'nav' ? 'text-xl' : 'text-lg'}"></span>
	{#if label && variant === 'nav'}
		<span class="font-sans text-[10px] uppercase tracking-widest mt-1 font-bold">
			{label}
		</span>
	{/if}
</button>
