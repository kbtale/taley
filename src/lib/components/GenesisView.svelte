<script lang="ts">
	import { getUIState } from '$lib/state/ui.svelte.js';

	const ui = getUIState();

	let seedPrompt = $state('');
	let complexity = $state<'low' | 'medium' | 'high'>('medium');

	function beginArchiving() {
		if (!seedPrompt.trim()) return;

		ui.setUniverse({
			id: crypto.randomUUID(),
			title: 'New Workspace',
			premise: seedPrompt,
			constraints: []
		});
	}

	function setTry(text: string) {
		seedPrompt = text;
	}
</script>

<main class="min-h-screen w-full flex flex-col items-center justify-center px-6 md:px-24">
	<div class="fixed top-0 left-0 p-8 opacity-20 pointer-events-none">
		<div class="w-12 h-12 border-t border-l border-sunlit-clay"></div>
	</div>
	<div class="fixed bottom-0 right-0 p-8 opacity-20 pointer-events-none">
		<div class="w-12 h-12 border-b border-r border-sunlit-clay"></div>
	</div>

	<div 
		class="absolute inset-0 pointer-events-none flex justify-center opacity-10" 
		style="background-image: radial-gradient(#d7c3b2 0.5px, transparent 0.5px); background-size: 10px 10px;"
	></div>

	<div class="w-full max-w-3xl space-y-12 flex flex-col items-center relative z-10">
		<div class="space-y-2 text-center">
			<h1 class="font-heading text-3xl md:text-4xl font-bold tracking-tight text-stone-900">What do you want to create?</h1>
			<p class="font-sans text-xs uppercase tracking-[0.2em] text-stone-500 opacity-70">Define World Premise</p>
		</div>

		<div class="w-full space-y-6">
			<div class="relative group">
				<textarea 
					bind:value={seedPrompt}
					autofocus
					class="w-full bg-linen border border-stone-300 p-6 md:p-8 text-xl md:text-2xl font-sans resize-none transition-all duration-300 shadow-sm focus:shadow-md focus:outline-none focus:border-sunlit-clay"
					style="scrollbar-width: thin; scrollbar-color: #d7c3b2 transparent;"
					placeholder="Describe the core mechanics of your world..." 
					rows="4"
				></textarea>

				<div class="flex flex-wrap justify-center gap-4 pt-4 opacity-60">
					<span class="font-sans text-[10px] uppercase tracking-wider text-stone-500">Try:</span>
					<button onclick={() => setTry("A hard sci-fi orbital colony...")} class="font-sans italic text-xs hover:text-sunlit-clay transition-colors">"A hard sci-fi orbital colony..."</button>
					<button onclick={() => setTry("A low-fantasy island nation...")} class="font-sans italic text-xs hover:text-sunlit-clay transition-colors">"A low-fantasy island nation..."</button>
					<button onclick={() => setTry("A dystopian underwater city...")} class="font-sans italic text-xs hover:text-sunlit-clay transition-colors">"A dystopian underwater city..."</button>
				</div>
			</div>

			<div class="flex flex-col items-center space-y-4 pt-4">
				<span class="font-sans text-[10px] uppercase tracking-widest text-stone-500 font-bold">Complexity Level</span>
				<div class="flex items-center p-1 bg-stone-100 border border-stone-300/30">
					<button 
						onclick={() => complexity = 'low'} 
						class="px-8 py-2 font-sans text-[10px] uppercase tracking-widest transition-colors duration-200 {complexity === 'low' ? 'bg-sunlit-clay text-linen font-bold shadow-sm' : 'text-stone-500 hover:bg-stone-200'}"
					>Low</button>
					<button 
						onclick={() => complexity = 'medium'} 
						class="px-8 py-2 font-sans text-[10px] uppercase tracking-widest transition-colors duration-200 {complexity === 'medium' ? 'bg-sunlit-clay text-linen font-bold shadow-sm' : 'text-stone-500 hover:bg-stone-200'}"
					>Medium</button>
					<button 
						onclick={() => complexity = 'high'} 
						class="px-8 py-2 font-sans text-[10px] uppercase tracking-widest transition-colors duration-200 {complexity === 'high' ? 'bg-sunlit-clay text-linen font-bold shadow-sm' : 'text-stone-500 hover:bg-stone-200'}"
					>High</button>
				</div>
			</div>
		</div>

		<button onclick={beginArchiving} class="group flex items-center space-x-3 opacity-80 hover:opacity-100 transition-opacity">
			<span class="font-heading font-bold text-sm uppercase tracking-[0.3em] text-sunlit-clay">Forge Universe</span>
			<span class="i-lucide-arrow-right text-sunlit-clay text-sm transition-transform group-hover:translate-x-1"></span>
		</button>
	</div>
</main>
