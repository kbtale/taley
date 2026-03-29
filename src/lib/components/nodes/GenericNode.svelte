<script lang="ts">
	import type { AppNode, NodeCategory } from '$lib/state/types.js';

	let { node, onclick }: { node: AppNode; onclick: (node: AppNode) => void } = $props();

	const categoryConfig: Record<Exclude<NodeCategory, 'biological'>, { border: string; text: string; icon: string; label: string; shape: string }> = {
		location: { border: 'border-muted-teal', text: 'text-muted-teal', icon: 'i-lucide-globe', label: 'Location', shape: '' },
		artifact: { border: 'border-sunlit-clay', text: 'text-sunlit-clay', icon: 'i-lucide-sparkles', label: 'Artifact', shape: 'rotate-45' },
		generic: { border: 'border-stone-400', text: 'text-stone-400', icon: 'i-lucide-box', label: 'Node', shape: '' }
	};

	const config = $derived(categoryConfig[node.category as Exclude<NodeCategory, 'biological'>] || categoryConfig.generic);
</script>

<button type="button" class="flex flex-col items-center cursor-pointer group bg-transparent" onclick={() => onclick(node)}>
	<div class="w-10 h-10 border-2 border-solid {config.border} bg-stone-50 flex items-center justify-center group-hover:opacity-80 transition-all {config.shape}">
		<span class="{config.icon} {config.text} text-lg {config.shape === 'rotate-45' ? '-rotate-45' : ''}"></span>
	</div>
	<div class="mt-2 text-center">
		<span class="block font-heading text-[11px] font-bold {config.text} uppercase">{node.name}</span>
		<span class="block font-sans text-[9px] text-stone-400 uppercase tracking-tighter">{config.label}</span>
	</div>
</button>
