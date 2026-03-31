<script lang="ts">
	import { getUIState } from '$lib/state/ui.svelte.js';
	import type { PendingMutation } from '$lib/state/types.js';

	const ui = getUIState();

	const node = $derived(ui.selectedNode);
	const universe = $derived(ui.universe);

	let isCollapsed = $state(false);
	let mutationCommand = $state('');
	let isSubmittingMutation = $state(false);
	let mutationError = $state<string | null>(null);

	function toggleCollapse() {
		isCollapsed = !isCollapsed;
	}

	function closeSelection() {
		ui.selectNode(null);
	}

	type MutationApiUpdatedNode = {
		id: string;
		name?: string;
		description?: string;
		payload?: Record<string, unknown>;
		category?: string;
	};

	type MutationApiCreatedNode = {
		id: string;
		name: string;
		category: string;
		description: string;
		payload?: Record<string, unknown>;
	};

	type MutationApiCreatedEdge = {
		source: string;
		target: string;
	};

	type MutationApiResponse = {
		runId?: string;
		persisted?: boolean;
		mutation?: {
			summary?: string;
			affectedNodeIds?: string[];
			createdNodes?: MutationApiCreatedNode[];
			updatedNodes?: MutationApiUpdatedNode[];
			createdEdges?: MutationApiCreatedEdge[];
		};
		error?: string;
		message?: string;
	};

	function normalizeNodeCategory(category: string): import('$lib/state/types.js').NodeCategory {
		switch (category) {
			case 'Character':
			case 'Location':
			case 'Artifact':
			case 'Event':
			case 'Collective':
			case 'Concept':
			case 'Phenomenon':
			case 'Unknown':
				return category;
			default:
				return 'Unknown';
		}
	}

	function buildMutationDiffs(updatedNodes: MutationApiUpdatedNode[]): PendingMutation['diffs'] {
		const diffs: PendingMutation['diffs'] = [];

		for (const updated of updatedNodes) {
			const current = ui.nodes.find((candidate) => candidate.id === updated.id);
			if (!current) {
				continue;
			}

			if (typeof updated.name === 'string' && updated.name !== current.name) {
				diffs.push({
					nodeId: current.id,
					nodeName: current.name,
					field: 'name',
					oldValue: current.name,
					newValue: updated.name
				});
			}

			if (typeof updated.description === 'string' && updated.description !== current.description) {
				diffs.push({
					nodeId: current.id,
					nodeName: current.name,
					field: 'description',
					oldValue: current.description,
					newValue: updated.description
				});
			}
		}

		return diffs;
	}

	async function submitMutationCommand() {
		if (!node || !mutationCommand.trim() || isSubmittingMutation) {
			return;
		}

		const targetNodeId = node.id;
		const command = mutationCommand.trim();
		let keepReviewOpen = false;

		isSubmittingMutation = true;
		mutationError = null;
		ui.startMutation();

		try {
			const response = await fetch('/api/nodes/mutate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ targetNodeId, command })
			});

			const payload: MutationApiResponse = await response.json().catch(() => ({}));
			if (!response.ok) {
				const message =
					typeof payload.message === 'string'
						? payload.message
						: typeof payload.error === 'string'
							? payload.error
							: 'Mutation request failed.';
				throw new Error(message);
			}

			const summary =
				typeof payload.mutation?.summary === 'string'
					? payload.mutation.summary
					: 'Mutation completed.';

			const affectedNodeIds = Array.isArray(payload.mutation?.affectedNodeIds)
				? payload.mutation.affectedNodeIds.filter((value): value is string => typeof value === 'string')
				: [targetNodeId];

			const updatedNodes = Array.isArray(payload.mutation?.updatedNodes)
				? payload.mutation.updatedNodes
						.filter((value): value is MutationApiUpdatedNode => value !== null && typeof value === 'object' && typeof (value as { id?: unknown }).id === 'string')
						.map((value) => ({
							id: value.id,
							...(typeof value.name === 'string' ? { name: value.name } : {}),
							...(typeof value.description === 'string' ? { description: value.description } : {}),
							...(value.payload && typeof value.payload === 'object' ? { payload: value.payload } : {})
						}))
				: [];

			const createdNodes = Array.isArray(payload.mutation?.createdNodes)
				? payload.mutation.createdNodes
						.filter(
							(value): value is MutationApiCreatedNode =>
								value !== null &&
								typeof value === 'object' &&
								typeof (value as { id?: unknown }).id === 'string' &&
								typeof (value as { name?: unknown }).name === 'string' &&
								typeof (value as { category?: unknown }).category === 'string' &&
								typeof (value as { description?: unknown }).description === 'string'
						)
						.map((value, index) => {
							const baseX = node?.position.x ?? 400;
							const baseY = node?.position.y ?? 300;
							return {
								id: value.id,
								name: value.name,
								category: normalizeNodeCategory(value.category),
								description: value.description,
								payload: value.payload,
								position: {
									x: baseX + (index + 1) * 60,
									y: baseY + ((index % 2 === 0 ? 1 : -1) * 50)
								}
							};
						})
				: [];

			const createdEdges = Array.isArray(payload.mutation?.createdEdges)
				? payload.mutation.createdEdges
						.filter(
							(value): value is MutationApiCreatedEdge =>
								value !== null &&
								typeof value === 'object' &&
								typeof (value as { source?: unknown }).source === 'string' &&
								typeof (value as { target?: unknown }).target === 'string'
						)
						.map((value) => ({
							id: crypto.randomUUID(),
							source: value.source,
							target: value.target
						}))
				: [];

			const diffs = buildMutationDiffs(updatedNodes);
			if (payload.persisted === false) {
				ui.stageMutation({
					id: payload.runId ?? crypto.randomUUID(),
					description: summary,
					affectedNodes: affectedNodeIds,
					createdNodes,
					updatedNodes,
					createdEdges,
					diffs
				});
				keepReviewOpen = true;
			} else if (diffs.length > 0 || createdNodes.length > 0 || createdEdges.length > 0) {
				ui.stageMutation({
					id: payload.runId ?? crypto.randomUUID(),
					description: summary,
					affectedNodes: affectedNodeIds,
					createdNodes,
					updatedNodes,
					createdEdges,
					diffs
				});
				ui.commitMutation();
			} else {
				ui.addEvent({
					id: crypto.randomUUID(),
					type: 'mutation',
					name: 'Mutation',
					message: summary,
					timestamp: Date.now()
				});
			}

			mutationCommand = '';
		} catch (err: unknown) {
			mutationError = err instanceof Error ? err.message : 'Mutation request failed.';
		} finally {
			isSubmittingMutation = false;
			if (!keepReviewOpen && ui.mutationState !== 'idle') {
				ui.abortMutation();
			}
		}
	}

	function handleMutationKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			void submitMutationCommand();
		}
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
				{#if node.category === 'Character' && payload?.identity}
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

			<div class="border-t border-stone-200 p-4 space-y-2 bg-stone-50">
				<span class="font-sans text-[10px] uppercase tracking-widest text-stone-400 font-bold">Local Mutation</span>
				<div class="w-full bg-white border-1 border-solid border-stone-300 shadow-sm flex items-center focus-within:border-burnt-peach transition-colors">
					<input
						type="text"
						bind:value={mutationCommand}
						onkeydown={handleMutationKeydown}
						placeholder="Mutate this node context..."
						class="appearance-none flex-1 bg-transparent p-3 text-sm font-sans border-none outline-none focus:ring-0 text-stone-900 placeholder-stone-400"
						disabled={isSubmittingMutation}
					/>
					<div class="p-1">
						<button
							onclick={() => void submitMutationCommand()}
							class="w-8 h-8 flex items-center justify-center bg-burnt-peach text-linen hover:opacity-90 transition-opacity disabled:opacity-20"
							disabled={!mutationCommand.trim() || isSubmittingMutation}
							aria-label="Run Local Mutation"
						>
							<span class="i-lucide-zap text-base"></span>
						</button>
					</div>
				</div>
				{#if isSubmittingMutation}
					<p class="font-sans text-[10px] uppercase tracking-widest text-stone-500">Calculating localized impact...</p>
				{/if}
				{#if mutationError}
					<p class="font-sans text-xs text-red-700">{mutationError}</p>
				{/if}
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
