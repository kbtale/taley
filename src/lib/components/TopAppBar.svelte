<script lang="ts">
	import Button from './ui/Button.svelte';
	import IconButton from './ui/IconButton.svelte';
</script>

<header class="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-8 h-16 bg-linen border-b border-stone-200">
	<div class="flex items-center gap-8">
		<span class="text-2xl font-black text-sunlit-clay uppercase font-heading tracking-tight">Taley</span>

		<nav class="hidden md:flex gap-6">
			<a class="text-sunlit-clay border-b-2 border-sunlit-clay pb-1 font-heading font-bold tracking-tight text-xs" href="#">
				Chronicles
			</a>
			<a class="text-stone-500 hover:text-sunlit-clay transition-colors duration-200 font-heading font-bold tracking-tight text-xs" href="#">
				Atlas
			</a>
			<a class="text-stone-500 hover:text-sunlit-clay transition-colors duration-200 font-heading font-bold tracking-tight text-xs" href="#">
				Lexicon
			</a>
			<a class="text-stone-500 hover:text-sunlit-clay transition-colors duration-200 font-heading font-bold tracking-tight text-xs" href="#">
				Settings
			</a>
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
