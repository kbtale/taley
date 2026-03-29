<script lang="ts">
	import { getUIState } from '$lib/state/ui.svelte.js';

	const ui = getUIState();
	const mutation = $derived(ui.pendingMutation);
</script>

<aside class="h-screen w-96 bg-stone-50 border-l border-stone-200 flex flex-col overflow-hidden shadow-2xl z-40 fixed right-0 top-0">
	<header class="p-8 border-b border-stone-300/20 bg-stone-100">
		<div class="flex items-center gap-3 mb-2">
			<span class="i-lucide-scroll text-sunlit-clay text-sm"></span>
			<span class="font-heading font-bold text-sunlit-clay uppercase tracking-widest text-[10px]">Proposed changes</span>
		</div>
		<h2 class="font-heading font-black text-2xl text-stone-900 uppercase leading-tight tracking-tight">World Changes</h2>
		<p class="font-sans text-[10px] text-stone-500 uppercase tracking-widest mt-1">Reviewing world response to recent input</p>
	</header>

	{#if mutation}
		<div class="flex-1 overflow-y-auto p-8 space-y-12" style="scrollbar-width: thin; scrollbar-color: #d7c3b2 transparent;">
			<section class="space-y-4">
				<h3 class="font-sans text-[10px] uppercase tracking-[0.2em] text-stone-400 font-bold italic">Context</h3>
				<p class="font-sans text-sm text-stone-600 leading-relaxed italic">
					{mutation.description}
				</p>
			</section>

			<section class="space-y-6">
				<h3 class="font-sans text-[10px] uppercase tracking-[0.2em] text-stone-400 font-bold italic">Details</h3>
				
				<div class="space-y-8">
					{#each mutation.diffs as diff (diff.nodeId + diff.field)}
						<div class="space-y-3">
							<div class="flex justify-between border-b border-stone-200 pb-2">
								<span class="font-heading font-bold text-xs uppercase text-stone-900">{diff.nodeName}</span>
								<span class="font-sans text-[9px] uppercase text-stone-400 font-medium">Field: {diff.field}</span>
							</div>
							
							<div class="grid grid-cols-2 gap-4">
								<div class="space-y-1">
									<span class="font-sans text-[8px] uppercase text-stone-400 tracking-widest">Base</span>
									<div class="bg-stone-200/50 p-2 text-xs font-mono text-stone-500 line-clamp-3">
										{diff.oldValue}
									</div>
								</div>
								<div class="space-y-1">
									<span class="font-sans text-[8px] uppercase text-stone-400 tracking-widest">Target</span>
									<div class="bg-muted-teal/10 p-2 text-xs font-mono text-muted-teal font-bold line-clamp-3">
										{diff.newValue}
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</section>
		</div>
	{/if}

	<footer class="p-4 border-t border-stone-200 bg-stone-100 opacity-60">
		<div class="flex justify-between items-center italic">
			<span class="font-sans text-[9px] uppercase tracking-widest font-bold">Structural Stability: 98%</span>
			<span class="i-lucide-activity text-stone-400 text-sm"></span>
		</div>
	</footer>
</aside>
