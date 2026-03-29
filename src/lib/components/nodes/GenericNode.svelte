<script lang="ts">
	import type { AppNode, NodeCategory } from '$lib/state/types.js';

	let { node, onclick, mutating = false }: { node: AppNode; onclick: (node: AppNode) => void, mutating?: boolean } = $props();

	const categoryConfig: Record<Exclude<NodeCategory, 'biological'>, { border: string; text: string; icon: string; label: string; shape: string }> = {
		location: { border: 'border-muted-teal', text: 'text-muted-teal', icon: 'i-lucide-globe', label: 'Location', shape: '' },
		artifact: { border: 'border-sunlit-clay', text: 'text-sunlit-clay', icon: 'i-lucide-sparkles', label: 'Artifact', shape: 'rotate-45' },
		generic: { border: 'border-stone-400', text: 'text-stone-400', icon: 'i-lucide-box', label: 'Node', shape: '' }
	};

	const config = $derived(categoryConfig[node.category as Exclude<NodeCategory, 'biological'>] || categoryConfig.generic);
</script>

<button type="button" class="relative flex flex-col items-center cursor-pointer group bg-transparent {mutating ? 'animate-pulse' : ''}" onclick={() => onclick(node)}>
	{#if mutating}
		<div class="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-burnt-peach text-white px-2 py-0.5 rounded-full whitespace-nowrap z-20">
			<span class="i-lucide-alert-triangle text-[8px]"></span>
			<span class="font-sans text-[8px] font-bold uppercase tracking-widest whitespace-nowrap">Changing</span>
		</div>
	{/if}
	<div class="w-10 h-10 border-2 border-solid {mutating ? 'border-burnt-peach bg-burnt-peach/10 shadow-[0_0_15px_rgba(163,61,29,0.3)]' : config.border + ' bg-stone-50'} flex items-center justify-center group-hover:opacity-80 transition-all {config.shape}">
		<span class="{config.icon} {mutating ? 'text-burnt-peach' : config.text} text-lg {config.shape === 'rotate-45' ? '-rotate-45' : ''}"></span>
	</div>
	<div class="mt-2 text-center">
		<span class="block font-heading text-[11px] font-bold {mutating ? 'text-burnt-peach' : config.text} uppercase">{node.name}</span>
		<span class="block font-sans text-[9px] text-stone-400 uppercase tracking-tighter">{config.label}</span>
	</div>
</button>
