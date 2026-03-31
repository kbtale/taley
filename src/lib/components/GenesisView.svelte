<script lang="ts">
	import { getUIState } from '$lib/state/ui.svelte.js';

	const ui = getUIState();

	let seedPrompt = $state('');
	let complexity = $state<'low' | 'medium' | 'high'>('medium');
	let textareaRef = $state<HTMLTextAreaElement | null>(null);

	$effect(() => {
		textareaRef?.focus();
	});

	let isGenerating = $state(false);

	async function createUniverse() {
		if (!seedPrompt.trim() || isGenerating) return;

		isGenerating = true;
		
		try {
			const response = await fetch('/api/universe/seed', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					premise: seedPrompt, 
					complexity 
				})
			});

			if (!response.ok) throw new Error('Big Bang failed');

			const data = await response.json();
			const { universe, nodes, edges } = data;

			ui.setUniverse({
				id: data.universeId,
				title: universe.name,
				premise: universe.seed_premise,
				constraints: universe.constraints || []
			});

			nodes.forEach((node: import('../schemas/node.js').Node) => {
				const logicalCategory: import('$lib/state/types.js').NodeCategory = (() => {
					switch (node.category) {
						case 'Character':
						case 'Location':
						case 'Artifact':
						case 'Event':
						case 'Collective':
						case 'Concept':
						case 'Phenomenon':
						case 'Unknown':
							return node.category;
						default:
							return 'Unknown';
					}
				})();

				ui.addNode({
					id: node.id,
					name: node.name,
					description: node.description,
					category: logicalCategory,
					payload: node.payload,
					position: { x: Math.random() * 800, y: Math.random() * 600 }
				});
			});

			edges.forEach((edge: import('../schemas/edge.js').Edge) => {
				ui.addEdge({
					id: crypto.randomUUID(),
					source: edge.source,
					target: edge.target
				});
			});

			ui.addEvent({
				id: crypto.randomUUID(),
				type: 'mutation',
				name: 'Genesis',
				message: `Universe "${universe.name}" generated successfully.`,
				timestamp: Date.now()
			});

		} catch (err) {
			console.error('Generation Error:', err);
			alert('Failed to generate universe. Please try again.');
		} finally {
			isGenerating = false;
		}
	}

	function setTry(text: string) {
		seedPrompt = text;
	}
</script>

<section class="h-full w-full flex flex-col items-center justify-center px-6 md:px-24">
	<div class="w-full max-w-3xl flex flex-col items-center relative z-10">
		<div class="text-center">
			<h1 class="font-heading text-3xl md:text-4xl font-bold tracking-tight text-stone-900">What do you want to create?</h1>
		</div>

		<div class="w-full">
			<div class="relative group">
				<div class="w-full bg-stone-50 border border-stone-200 flex items-end shadow-sm duration-300 transition-all focus-within:border-burnt-peach focus-within:ring-1 focus-within:ring-burnt-peach/20">
					<textarea 
						bind:value={seedPrompt}
						bind:this={textareaRef}
						class="appearance-none flex-1 bg-transparent p-4 text-base font-sans resize-none border-none outline-none focus:ring-0 text-stone-900 placeholder-stone-400"
						style="scrollbar-width: thin; scrollbar-color: #d7c3b2 transparent;"
						placeholder="Describe the world you want to create..." 
						rows="4"
					></textarea>

					<div class="p-2">
						<button 
							onclick={createUniverse}
							class="w-10 h-10 flex items-center justify-center bg-burnt-peach text-linen hover:opacity-90 transition-opacity disabled:opacity-20"
							disabled={!seedPrompt.trim()}
							aria-label="Create Universe"
						>
							<span class="i-lucide-arrow-up text-lg"></span>
						</button>
					</div>
				</div>

				<div class="flex flex-wrap justify-center gap-4 pt-4 opacity-60">
					<span class="font-sans text-[10px] uppercase tracking-wider text-stone-500">Try:</span>
					<button onclick={() => setTry("A hard sci-fi orbital colony...")} class="font-sans italic text-xs hover:text-burnt-peach transition-colors">"A hard sci-fi orbital colony..."</button>
					<button onclick={() => setTry("A low-fantasy island nation...")} class="font-sans italic text-xs hover:text-burnt-peach transition-colors">"A low-fantasy island nation..."</button>
					<button onclick={() => setTry("A dystopian underwater city...")} class="font-sans italic text-xs hover:text-burnt-peach transition-colors">"A dystopian underwater city..."</button>
				</div>
			</div>

			<div class="flex flex-col items-center pt-8">
				<span class="font-sans text-xs uppercase tracking-widest text-stone-500 font-bold">Complexity</span>
				<div class="flex items-center p-1 bg-stone-100 border-1 border-solid border-stone-300 mt-1">
					<button 
						onclick={() => complexity = 'low'} 
						class="px-8 py-2 font-sans text-[10px] uppercase tracking-widest transition-colors duration-200 {complexity === 'low' ? 'bg-burnt-peach text-linen font-bold shadow-sm' : 'text-stone-500 hover:bg-stone-200'}"
					>Low</button>
					<button 
						onclick={() => complexity = 'medium'} 
						class="px-8 py-2 font-sans text-[10px] uppercase tracking-widest transition-colors duration-200 {complexity === 'medium' ? 'bg-burnt-peach text-linen font-bold shadow-sm' : 'text-stone-500 hover:bg-stone-200'}"
					>Medium</button>
					<button 
						onclick={() => complexity = 'high'} 
						class="px-8 py-2 font-sans text-[10px] uppercase tracking-widest transition-colors duration-200 {complexity === 'high' ? 'bg-burnt-peach text-linen font-bold shadow-sm' : 'text-stone-500 hover:bg-stone-200'}"
					>High</button>
				</div>
			</div>
		</div>
	</div>
</section>
