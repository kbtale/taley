<script lang="ts">
	import Button from './ui/Button.svelte';
	import IconButton from './ui/IconButton.svelte';
	import { getUIState } from '$lib/state/ui.svelte.js';

	const ui = getUIState();

	function goToGenesis() {
		ui.setView('genesis');
	}
</script>

<header class="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-8 h-16 bg-linen border-b-1 border-solid border-stone-300">
	<div class="flex items-center gap-8">
		<button
			onclick={goToGenesis}
			class="text-2xl font-black text-burnt-peach uppercase font-heading tracking-tight bg-transparent border-0 cursor-pointer p-0"
			aria-label="Go to Genesis"
		>
			Taley
		</button>

		<nav class="hidden md:flex gap-6">
			<button class="text-burnt-peach border-b-2 border-burnt-peach pb-1 font-heading font-bold tracking-tight text-xs bg-transparent border-t-0 border-x-0 cursor-pointer">
				Chronicles
			</button>
			<button class="text-stone-500 hover:text-burnt-peach transition-colors duration-200 font-heading font-bold tracking-tight text-xs bg-transparent border-0 cursor-pointer">
				Atlas
			</button>
			<button class="text-stone-500 hover:text-burnt-peach transition-colors duration-200 font-heading font-bold tracking-tight text-xs bg-transparent border-0 cursor-pointer">
				Lexicon
			</button>
			<button class="text-stone-500 hover:text-burnt-peach transition-colors duration-200 font-heading font-bold tracking-tight text-xs bg-transparent border-0 cursor-pointer">
				Settings
			</button>
		</nav>
	</div>

	<div class="flex items-center gap-4">
		<Button variant="primary" size="sm">
			Forge Node
		</Button>
		
		<div class="flex gap-1">
			<IconButton icon="i-lucide-bell" variant="ghost" />
			<IconButton icon="i-lucide-user-circle" variant="ghost" />
		</div>
	</div>
</header>
