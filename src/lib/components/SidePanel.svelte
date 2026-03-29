<script lang="ts">
	import { getUIState } from '$lib/state/ui.svelte.js';

	const ui = getUIState();

	let command = $state('');

	const universe = $derived(ui.universe);
	const events = $derived(ui.events);

	function getEventColor(type: string) {
		switch (type) {
			case 'node_added': return 'bg-muted-teal';
			case 'discovery': return 'bg-sunlit-clay';
			case 'mutation': return 'bg-burnt-peach';
			default: return 'bg-stone-400';
		}
	}

	function submitCommand() {
		const cmd = command.trim();
		if (!cmd) return;

		if (['/mutate', '/mutation'].includes(cmd.toLowerCase())) {
			ui.startMutation();
			setTimeout(() => {
				const protagonist = ui.nodes.find(n => n.category === 'biological');
				ui.stageMutation({
					id: crypto.randomUUID(),
					description: 'The entity undergoes a radical biological shift as the resonance rift stabilizes.',
					affectedNodes: protagonist ? [protagonist.id] : [],
					diffs: protagonist ? [{
						nodeId: protagonist.id,
						nodeName: protagonist.name,
						field: 'description',
						oldValue: protagonist.description,
						newValue: 'A being fully synthesized with the rhythmic resonance of the rift.'
					}] : []
				});
			}, 1500);
		} else {
			ui.addEvent({
				id: crypto.randomUUID(),
				type: 'mutation',
				name: 'Command',
				message: cmd,
				timestamp: Date.now()
			});
		}
		command = '';
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			submitCommand();
		}
	}
</script>

<aside class="w-96 h-full flex flex-col bg-stone-50 border-r-1 border-solid border-t-0 border-b-0 border-l-0 border-stone-300 z-40">
	<header class="p-6">
		<h2 class="font-heading text-lg font-bold text-stone-900 tracking-tight uppercase tracking-[0.2em] opacity-40">
			{universe?.title || 'Conversation'}
		</h2>
	</header>

	<section class="flex-1 overflow-y-auto px-8 py-6" style="scrollbar-width: thin; scrollbar-color: #d7c3b2 transparent;">
		{#if events.length > 0}
			<div class="space-y-6">
				{#each events as event (event.id)}
					<div class="relative pl-6 transition-all duration-500">
						<div class="absolute -left-[5px] top-1.5 w-2 h-2 {getEventColor(event.type)}"></div>
						<p class="font-sans text-sm text-stone-800 leading-relaxed">
							{event.message}
						</p>
						<span class="font-sans text-[9px] text-stone-400 block mt-1 uppercase tracking-widest font-bold">
							{new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
						</span>
					</div>
				{/each}
			</div>
		{/if}
	</section>

	<div class="p-6">
		<div class="w-full bg-white border-1 border-solid border-stone-300 shadow-sm flex items-center focus-within:border-burnt-peach transition-colors">
			<input 
				type="text"
				bind:value={command}
				onkeydown={handleKeydown}
				placeholder="Message"
				class="appearance-none flex-1 bg-transparent p-3 text-sm font-sans border-none outline-none focus:ring-0 text-stone-900 placeholder-stone-400"
			/>
			<div class="p-1">
				<button 
					onclick={submitCommand}
					class="w-8 h-8 flex items-center justify-center bg-burnt-peach text-linen hover:opacity-90 transition-opacity disabled:opacity-20"
					disabled={!command.trim()}
					aria-label="Send Message"
				>
					<span class="i-lucide-arrow-up text-base"></span>
				</button>
			</div>
		</div>
	</div>
</aside>
