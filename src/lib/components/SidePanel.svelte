<script lang="ts">
	import { getUIState } from '$lib/state/ui.svelte.js';

	const ui = getUIState();

	let command = $state('');

	const universe = $derived(ui.universe);
	const events = $derived(ui.events);
</script>

<aside class="w-96 h-full flex flex-col bg-stone-50 border-r border-stone-200">
	{#if universe}
		<section class="p-8 border-b border-stone-200">
			<h2 class="font-heading text-2xl font-bold text-stone-900 mb-4">{universe.title}</h2>
			<p class="text-stone-600 font-sans italic mb-6 leading-relaxed">"{universe.premise}"</p>
			
			{#if universe.constraints.length > 0}
				<div class="space-y-4">
					<h3 class="font-sans text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold">Constraints</h3>
					<ol class="space-y-3 font-sans text-sm text-stone-700 list-decimal list-inside">
						{#each universe.constraints as constraint, i (i)}
							<li>{constraint}</li>
						{/each}
					</ol>
				</div>
			{/if}
		</section>
	{/if}

	<section class="flex-1 overflow-y-auto px-8 py-6">
		<h3 class="font-sans text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold mb-6">Chronicles Feed</h3>
		
		{#if events.length === 0}
			<p class="text-stone-400 font-sans text-xs italic">No activity yet</p>
		{:else}
			<div class="space-y-8">
				{#each events as event (event.id)}
					<div class="relative pl-6 border-l border-stone-300/50">
						<div class="absolute -left-[5px] top-0 w-2.h-2 bg-sunlit-clay"></div>
						<span class="font-sans text-[10px] text-stone-400 block mb-1 uppercase tracking-widest">
							{new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
						</span>
						<p class="font-sans text-sm text-stone-800 leading-snug">{event.message}</p>
					</div>
				{/each}
			</div>
		{/if}
	</section>

	<div class="p-6 bg-stone-100 border-t border-stone-200">
		<div class="relative group">
			<input 
				type="text"
				bind:value={command}
				placeholder="Enter mutation..."
				class="w-full bg-transparent border-b border-stone-300 focus:border-sunlit-clay transition-colors font-sans text-sm py-2 px-1 focus:ring-0 outline-none"
			/>
			<span class="absolute right-2 bottom-2 i-lucide-terminal text-stone-400 text-lg"></span>
		</div>
	</div>
</aside>
