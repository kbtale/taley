<script lang="ts">
	import IconButton from './ui/IconButton.svelte';
</script>

<nav class="fixed bottom-0 left-0 w-full md:hidden flex justify-around items-center py-3 px-4 bg-linen border-t border-stone-200 z-50">
	<IconButton icon="i-lucide-network" label="Graph" variant="nav" />
	<IconButton icon="i-lucide-scroll-text" label="Feed" variant="nav" />
	<IconButton icon="i-lucide-book-open" label="Codex" variant="nav" active={true} />
	<IconButton icon="i-lucide-search" label="Search" variant="nav" />
</nav>
