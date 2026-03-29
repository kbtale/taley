<script lang="ts">
	import { getUIState } from '$lib/state/ui.svelte.js';

	const ui = getUIState();

	let seedPrompt = $state('');
	let complexity = $state<'low' | 'medium' | 'high'>('medium');
	let textareaRef = $state<HTMLTextAreaElement | null>(null);

	$effect(() => {
		textareaRef?.focus();
	});

	function createUniverse() {
		if (!seedPrompt.trim()) return;

		ui.setUniverse({
			id: crypto.randomUUID(),
			title: 'New Workspace',
			premise: seedPrompt,
			constraints: [
				'Physics is governed by rhythmic resonance',
				'No silicon-based technology exists',
				'Linear time is perceived only by biological beings'
			]
		});
		ui.addEvent({
			id: crypto.randomUUID(),
			type: 'mutation',
			name: 'Genesis',
			message: seedPrompt,
			timestamp: Date.now()
		});

		// Seed starter nodes
		const entityId = crypto.randomUUID();
		const locationId = crypto.randomUUID();
		const artifactId = crypto.randomUUID();

		ui.addNode({ 
			id: entityId, 
			name: 'Protagonist', 
			category: 'biological', 
			description: 'The central entity of this nascent world, currently lacking a defined path but possessing a strong resonance with the underlying laws of the universe.',
			position: { x: 300, y: 250 },
			payload: {
				identity: { age: 28, gender: 'Non-binary', species: 'Humanoid', origin: 'The Resonance Rift' },
				psychology: {
					mbti: 'INTJ',
					enneagram: '5w6',
					big5: { openness: 85, conscientiousness: 70, extraversion: 30, agreeableness: 45, neuroticism: 40 }
				}
			}
		});
		ui.addNode({ id: locationId, name: 'Origin', category: 'location', description: 'A geographical node of high symbolic importance.', position: { x: 550, y: 200 } });
		ui.addNode({ id: artifactId, name: 'Catalyst', category: 'artifact', description: 'A physical object that triggers a phase shift in the narrative.', position: { x: 450, y: 420 } });

		ui.addEdge({ id: crypto.randomUUID(), source: entityId, target: locationId, label: 'Inhabits' });
		ui.addEdge({ id: crypto.randomUUID(), source: entityId, target: artifactId, label: 'Seeks' });
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
							aria-label="Forge Universe"
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
