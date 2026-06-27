<script lang="ts">
	import { Settings } from '@lucide/svelte';
	import type { I18n } from './types';

	let { t, onSettings = () => {} }: { t: I18n; onSettings?: () => void } = $props();
</script>

<div class="flex items-center gap-4 py-0.5 px-xs">
	<div
		class="w-12 h-12 rounded-lg border-thick border-primary shadow-md grid place-items-center shrink-0 bg-accent rotate-[-4deg]"
	>
		<img src="/favicon/favicon-64.png" alt="Clear The Tab" class="w-10 h-10 rotate-[-4deg]" />
	</div>
	<div class="min-w-0 flex-1">
		<h1
			class="m-0 font-bricolage font-extrabold text-5xl text-primary-light leading-tight"
			style="letter-spacing:-0.02em"
		>
			Clear The Tab
		</h1>
		<p
			class="mt-0.5 m-0 text-md text-muted font-bold whitespace-nowrap overflow-hidden text-ellipsis"
		>
			{t.subtitle}
		</p>
	</div>
	<button
		class="w-11 h-11 shrink-0 border-thick border-primary rounded-md bg-white shadow-md grid place-items-center text-primary cursor-pointer"
		type="button"
		onclick={onSettings}
		aria-label="Settings"
	>
		<Settings class="w-6 h-6" />
	</button>
</div>
