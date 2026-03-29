<script lang="ts">
	import { getUIState } from '$lib/state/ui.svelte.js';
	import { fade, fly } from 'svelte/transition';

	const ui = getUIState();

	const isCalculating = $derived(ui.mutationState === 'calculating');
	const isReviewing = $derived(ui.mutationState === 'reviewing');
	const mutation = $derived(ui.pendingMutation);
</script>

{#if ui.mutationState !== 'idle'}
	<div 
		class="fixed top-20 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center"
		transition:fly={{ y: -50, duration: 400 }}
	>
		<div class="bg-burnt-peach text-linen px-8 py-3 shadow-[0_12px_40px_rgba(82,68,55,0.2)] flex items-center gap-4">
			<span class="i-lucide-rotate-cw text-xl {isCalculating ? 'animate-spin' : ''}"></span>
			
			<div class="flex flex-col">
				<span class="font-heading font-bold text-lg leading-tight uppercase tracking-tighter">
					{isCalculating ? 'Processing...' : 'Reviewing changes'}
				</span>
				<span class="font-sans text-[10px] tracking-[0.2em] opacity-80 uppercase">
					{isCalculating ? 'Analyzing world impact' : 'Reviewing proposed modifications'}
				</span>
			</div>

			{#if isReviewing && mutation}
				<div class="h-8 w-[1px] bg-white/30 ml-4"></div>
				<div class="flex flex-col ml-4">
					<span class="font-heading font-black text-xl leading-tight">
						{mutation.affectedNodes.length}
					</span>
					<span class="font-sans text-[10px] uppercase tracking-widest leading-none">
						Nodes Affected
					</span>
				</div>
			{/if}
		</div>
	</div>

	{#if isReviewing}
		<div 
			class="fixed bottom-12 left-1/2 -translate-x-1/2 z-[60] flex gap-1 items-center"
			transition:fly={{ y: 50, duration: 400 }}
		>
			<button 
				onclick={() => ui.commitMutation()}
				class="group relative bg-stone-900 text-linen px-12 py-5 font-heading font-black text-xl uppercase tracking-widest overflow-hidden transition-all active:scale-95 shadow-2xl"
			>
				<span class="relative z-10">Proceed</span>
				<div class="absolute inset-0 bg-muted-teal opacity-0 group-hover:opacity-20 transition-opacity"></div>
			</button>

			<button 
				onclick={() => ui.abortMutation()}
				class="bg-stone-200 text-stone-600 px-12 py-5 font-heading font-bold text-xl uppercase tracking-widest hover:bg-burnt-peach hover:text-white transition-colors active:scale-95 border-l border-stone-300 shadow-2xl"
			>
				Abort
			</button>
		</div>

		<div 
			class="fixed inset-0 bg-stone-900/10 backdrop-blur-[1px] z-50 pointer-events-none"
			transition:fade
		></div>
	{/if}
{/if}
