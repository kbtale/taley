<script lang="ts">
	import { getUIState } from '$lib/state/ui.svelte.js';

	const ui = getUIState();

	const node = $derived(ui.selectedNode);
	const universe = $derived(ui.universe);

	let isCollapsed = $state(false);

	function toggleCollapse() {
		isCollapsed = !isCollapsed;
	}

	function closeSelection() {
		ui.selectNode(null);
	}

	// Helper for Big 5 labels
	const big5Labels: Record<string, string> = {
		openness: 'Openness',
		conscientiousness: 'Conscientiousness',
		extraversion: 'Extraversion',
		agreeableness: 'Agreeableness',
		neuroticism: 'Neuroticism'
	};

	// Type identifiers for payload access
	interface BioPayload {
		identity: Record<string, string | number>;
		psychology: {
			mbti: string;
			enneagram: string;
			big5: Record<string, number>;
		};
	}
</script>

<aside 
	class="h-full bg-stone-50 border-l-1 border-solid border-stone-300 flex flex-col overflow-hidden shadow-sm z-40 transition-all duration-300 ease-in-out relative {isCollapsed ? 'w-12' : 'w-96'}"
>
	<button 
		onclick={toggleCollapse}
		class="absolute left-0 top-0 bottom-0 w-12 flex flex-col items-center py-6 hover:bg-stone-100 transition-colors z-50 {isCollapsed ? 'opacity-100' : 'opacity-0 pointer-events-none'}"
		aria-label={isCollapsed ? 'Expand' : 'Collapse'}
	>
		<span class="i-lucide-scroll text-stone-400 text-lg mb-8"></span>
		<span class="font-heading text-[10px] items-center uppercase tracking-[0.3em] text-stone-400 [writing-mode:vertical-lr] rotate-180">
			{node ? 'Node Details' : 'World Identity'}
		</span>
	</button>

	<div class="flex flex-col h-full w-96 {isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}" style="min-width: 384px;">
		{#if node}
			{@const payload = node.payload as unknown as BioPayload}
			<header class="p-6 border-b border-stone-200 bg-stone-100/50">
				<div class="flex justify-between items-start mb-4">
					<div class="flex items-center gap-3">
						<button onclick={toggleCollapse} class="p-1 hover:bg-stone-200 transition-colors rounded-sm" aria-label="Collapse">
							<span class="i-lucide-chevron-right text-stone-400"></span>
						</button>
						<span class="font-sans text-[10px] uppercase tracking-widest text-stone-400 font-bold">Node Details</span>
					</div>
					<button onclick={closeSelection} class="p-1 hover:bg-stone-200 transition-colors rounded-sm" aria-label="Close">
						<span class="i-lucide-x text-stone-500"></span>
					</button>
				</div>
				<h2 class="font-heading text-xl font-bold text-stone-900 uppercase tracking-tight leading-tight">{node.name}</h2>
				<span class="inline-block mt-1 px-2 py-0.5 bg-stone-200 text-stone-600 font-sans text-[9px] uppercase tracking-tighter font-bold">{node.category}</span>
			</header>

			<div class="flex-1 overflow-y-auto px-6 py-8 space-y-10" style="scrollbar-width: thin; scrollbar-color: #d7c3b2 transparent;">
				{#if node.category === 'biological' && payload?.identity}
					<section>
						<h3 class="font-sans text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-4">Identity</h3>
						<div class="grid grid-cols-2 gap-4">
							{#each Object.entries(payload.identity) as [key, value] (key)}
								<div class="space-y-1">
									<span class="block font-sans text-[9px] uppercase text-stone-400">{key}</span>
									<span class="block font-sans text-xs text-stone-800 font-medium">{value}</span>
								</div>
							{/each}
						</div>
					</section>

					{#if payload.psychology}
						<section class="space-y-6">
							<h3 class="font-sans text-[10px] uppercase tracking-widest text-stone-400 font-bold">Psychology</h3>
							
							<div class="flex gap-2">
								<div class="px-2 py-1 bg-stone-200 text-stone-700 text-[10px] font-bold uppercase">{payload.psychology.mbti}</div>
								<div class="px-2 py-1 border border-stone-300 text-stone-600 text-[10px] font-bold uppercase">{payload.psychology.enneagram}</div>
							</div>

							<div class="space-y-3">
								{#each Object.entries(payload.psychology.big5) as [trait, value] (trait)}
									<div class="space-y-1">
										<div class="flex justify-between items-center">
											<span class="font-sans text-[9px] uppercase text-stone-500">{big5Labels[trait] || trait}</span>
											<span class="font-sans text-[9px] font-bold text-stone-800">{value}%</span>
										</div>
										<div class="h-1 w-full bg-stone-200 overflow-hidden">
											<div class="h-full bg-burnt-peach transition-all duration-1000" style="width: {value}%"></div>
										</div>
									</div>
								{/each}
							</div>
						</section>
					{/if}
				{/if}

				<section>
					<h3 class="font-sans text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-4">
						Description
					</h3>
					<div class="border-l-2 border-stone-200 pl-4 py-1">
						<p class="font-sans text-sm text-stone-600 leading-relaxed italic">
							{node.description}
						</p>
					</div>
				</section>
			</div>

		{:else if universe}
			<header class="p-6 border-b border-stone-200 bg-stone-100/50">
				<div class="flex items-center gap-3">
					<button onclick={toggleCollapse} class="p-1 hover:bg-stone-200 transition-colors rounded-sm" aria-label="Collapse">
						<span class="i-lucide-chevron-right text-stone-400"></span>
					</button>
					<span class="font-sans text-[10px] uppercase tracking-widest text-stone-400 font-bold">World Identity</span>
				</div>
			</header>

			<div class="flex-1 overflow-y-auto px-6 py-8 space-y-12" style="scrollbar-width: thin; scrollbar-color: #d7c3b2 transparent;">
				<section>
					<h3 class="font-sans text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-4">Premise</h3>
					<p class="font-sans text-sm text-stone-700 leading-relaxed font-medium">
						{universe.premise}
					</p>
				</section>

				<section>
					<h3 class="font-sans text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-6">Constraints</h3>
					<div class="space-y-6">
						{#each universe.constraints as constraint, i (constraint)}
							<div class="flex gap-4 group">
								<span class="font-heading text-lg text-stone-300 font-bold">{(i + 1).toString().padStart(2, '0')}</span>
								<p class="font-sans text-xs text-stone-600 pt-1 leading-normal tracking-tight">
									{constraint}
								</p>
							</div>
						{/each}
					</div>
				</section>
			</div>
		{/if}
	</div>
</aside>
