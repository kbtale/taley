<script lang="ts">
	import { Svelvet, Node } from 'svelvet';
	import { getUIState } from '$lib/state/ui.svelte.js';
	import BiologicalNode from './nodes/BiologicalNode.svelte';
	import GenericNode from './nodes/GenericNode.svelte';
	import CanvasControls from './CanvasControls.svelte';
	import type { AppNode } from '$lib/state/types.js';

	const ui = getUIState();

	const nodes = $derived(ui.nodes);

	function handleNodeClick(node: AppNode) {
		ui.selectNode(node);
	}

	function zoomIn() {}
	function zoomOut() {}
	function centerView() {}
</script>

<div 
	class="flex-1 relative overflow-hidden canvas-grid" 
	onclick={(e) => {
		if (e.target === e.currentTarget) ui.selectNode(null);
	}}
	role="presentation"
>
	<Svelvet minimap={false} controls={false} fitView>
		{#each nodes as node (node.id)}
			{@const isMutating = ui.mutationState === 'reviewing' && ui.pendingMutation?.affectedNodes.includes(node.id)}
			<Node id={node.id} position={{ x: node.position.x, y: node.position.y }} bgColor="transparent" borderColor="transparent" let:grabHandle>
				<div use:grabHandle>
					{#if node.category === 'biological'}
						<BiologicalNode {node} onclick={handleNodeClick} mutating={isMutating} />
					{:else}
						<GenericNode {node} onclick={handleNodeClick} mutating={isMutating} />
					{/if}
				</div>
			</Node>
		{/each}
	</Svelvet>

	<CanvasControls onzoomin={zoomIn} onzoomout={zoomOut} oncenter={centerView} />
</div>

<style>
	.canvas-grid {
		background-color: #FAF0E6;
		background-image: radial-gradient(#d7c3b2 0.5px, transparent 0.5px);
		background-size: 24px 24px;
	}

	:global(.canvas-grid .svelvet-node) {
		--default-node-color: transparent;
		--default-node-border-width: 0px;
		--default-node-shadow: none;
		--node-color: transparent;
		--node-border-width: 0px;
	}
</style>
