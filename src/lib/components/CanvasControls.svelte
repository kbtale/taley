<script lang="ts">
	let { onzoomin, onzoomout, oncenter }: { onzoomin: () => void; onzoomout: () => void; oncenter: () => void } = $props();
</script>

<div class="absolute bottom-10 left-10 flex gap-1 bg-stone-50/80 backdrop-blur p-1 border-1 border-solid border-stone-300 shadow-sm z-10">
	<button
		onclick={onzoomin}
		class="w-10 h-10 flex items-center justify-center hover:bg-stone-200 transition-colors"
		aria-label="Zoom in"
	>
		<span class="i-lucide-zoom-in text-stone-600 text-lg"></span>
	</button>
	<button
		onclick={onzoomout}
		class="w-10 h-10 flex items-center justify-center hover:bg-stone-200 transition-colors"
		aria-label="Zoom out"
	>
		<span class="i-lucide-zoom-out text-stone-600 text-lg"></span>
	</button>
	<button
		onclick={oncenter}
		class="w-10 h-10 flex items-center justify-center hover:bg-stone-200 transition-colors"
		aria-label="Center view"
	>
		<span class="i-lucide-locate text-stone-600 text-lg"></span>
	</button>
</div>
