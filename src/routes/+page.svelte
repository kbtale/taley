<script lang="ts">
	import { getUIState } from '$lib/state/ui.svelte.js';
	import GenesisView from '$lib/components/GenesisView.svelte';
	import SidePanel from '$lib/components/SidePanel.svelte';
	import GraphCanvas from '$lib/components/GraphCanvas.svelte';
	import InspectionPanel from '$lib/components/InspectionPanel.svelte';

	const ui = getUIState();
</script>

{#if ui.currentView === 'genesis'}
	<GenesisView />
{:else if ui.currentView === 'architect'}
	<div class="flex h-full w-full overflow-hidden bg-linen">
		<SidePanel />
		<GraphCanvas />
		<InspectionPanel />
	</div>
{/if}
