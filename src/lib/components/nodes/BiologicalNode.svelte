<script lang="ts">
	import type { AppNode } from '$lib/state/types.js';

	let { node, onclick, mutating = false }: { node: AppNode; onclick: (node: AppNode) => void, mutating?: boolean } = $props();
</script>

<button type="button" class="relative flex flex-col items-center cursor-pointer group bg-transparent {mutating ? 'animate-pulse' : ''}" onclick={() => onclick(node)}>
	{#if mutating}
		<div class="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-burnt-peach text-white px-2 py-0.5 rounded-full whitespace-nowrap z-20">
			<span class="i-lucide-alert-triangle text-[8px]"></span>
			<span class="font-sans text-[8px] font-bold uppercase tracking-widest whitespace-nowrap">Changing</span>
		</div>
	{/if}
	<div class="w-12 h-12 rounded-full border-2 border-solid {mutating ? 'border-burnt-peach bg-burnt-peach/10 shadow-[0_0_15px_rgba(163,61,29,0.3)]' : 'border-burnt-peach bg-stone-50'} flex items-center justify-center group-hover:bg-burnt-peach transition-colors">
		<span class="i-lucide-users {mutating ? 'text-white' : 'text-burnt-peach'} group-hover:text-linen text-lg transition-colors"></span>
	</div>
	<div class="mt-2 text-center">
		<span class="block font-heading text-[11px] font-bold {mutating ? 'text-burnt-peach' : 'text-burnt-peach'} uppercase">{node.name}</span>
		<span class="block font-sans text-[9px] text-stone-400 uppercase tracking-tighter">Character</span>
	</div>
</button>
