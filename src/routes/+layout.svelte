<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';
	import TopAppBar from '$lib/components/TopAppBar.svelte';
	import BottomNavBar from '$lib/components/BottomNavBar.svelte';
	import { initUIState } from '$lib/state/ui.svelte.js';

	initUIState();

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="h-screen w-screen overflow-hidden bg-linen text-stone-900 font-sans flex flex-col">
	<TopAppBar />
	
	<main class="flex-1 mt-16 overflow-hidden">
		{@render children()}
	</main>
	
	<BottomNavBar />
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		overflow: hidden;
	}

	:global(*) {
		box-sizing: border-box;
	}
</style>
