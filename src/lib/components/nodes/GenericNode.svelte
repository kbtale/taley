<script lang="ts">
	import type { AppNode, NodeCategory } from '$lib/state/types.js';

	let { node, onclick, mutating = false }: { node: AppNode; onclick: (node: AppNode) => void, mutating?: boolean } = $props();

	const categoryConfig: Record<Exclude<NodeCategory, 'Character'>, { border: string; text: string; icon: string; label: string; shape: string }> = {
		Location: { border: 'border-muted-teal', text: 'text-muted-teal', icon: 'i-lucide-globe', label: 'Location', shape: '' },
		Artifact: { border: 'border-sunlit-clay', text: 'text-sunlit-clay', icon: 'i-lucide-sparkles', label: 'Artifact', shape: 'rotate-45' },
		Event: { border: 'border-burnt-peach', text: 'text-burnt-peach', icon: 'i-lucide-zap', label: 'Event', shape: '' },
		Collective: { border: 'border-blush-rose', text: 'text-blush-rose', icon: 'i-lucide-users', label: 'Collective', shape: '' },
		Concept: { border: 'border-stone-500', text: 'text-stone-500', icon: 'i-lucide-lightbulb', label: 'Concept', shape: '' },
		Phenomenon: { border: 'border-muted-teal', text: 'text-muted-teal', icon: 'i-lucide-orbit', label: 'Phenomenon', shape: '' },
		Unknown: { border: 'border-stone-400', text: 'text-stone-400', icon: 'i-lucide-circle-help', label: 'Unknown', shape: '' }
	};

	const config = $derived(categoryConfig[node.category as Exclude<NodeCategory, 'Character'>] || categoryConfig.Unknown);
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
