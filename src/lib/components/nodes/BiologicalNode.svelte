<script lang="ts">
	import type { AppNode } from '$lib/state/types.js';

	let { node, onclick }: { node: AppNode; onclick: (node: AppNode) => void } = $props();
</script>

<button type="button" class="flex flex-col items-center cursor-pointer group bg-transparent" onclick={() => onclick(node)}>
	<div class="w-12 h-12 rounded-full border-2 border-solid border-burnt-peach bg-stone-50 flex items-center justify-center group-hover:bg-burnt-peach transition-colors">
		<span class="i-lucide-users text-burnt-peach group-hover:text-linen text-lg transition-colors"></span>
	</div>
	<div class="mt-2 text-center">
		<span class="block font-heading text-[11px] font-bold text-burnt-peach uppercase">{node.name}</span>
		<span class="block font-sans text-[9px] text-stone-400 uppercase tracking-tighter">Entity</span>
	</div>
</button>
