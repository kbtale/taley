<script lang="ts">
	import { getUIState } from '$lib/state/ui.svelte.js';
	import GenesisView from '$lib/components/GenesisView.svelte';
	import SidePanel from '$lib/components/SidePanel.svelte';

	const ui = getUIState();
</script>

{#if ui.currentView === 'genesis'}
	<GenesisView />
{:else if ui.currentView === 'architect'}
	<div class="flex h-full w-full overflow-hidden bg-linen">
		<SidePanel />
		<section class="flex-1 relative overflow-hidden flex items-center justify-center">
			<div class="text-stone-300 font-sans uppercase tracking-[0.3em] text-xs">
				Atlas View
			</div>
		</section>
	</div>
{/if}
