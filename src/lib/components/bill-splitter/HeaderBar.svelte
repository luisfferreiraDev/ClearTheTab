<script lang="ts">
	import type { I18n } from './types';

	let {
		t,
		accent = '#FF6A3D',
		onSettings = () => {}
	}: { t: I18n; accent?: string; onSettings?: () => void } = $props();
</script>

<div class="flex items-center gap-lg py-0.5 px-xs">
	<div
		class="w-12 h-12 rounded-lg border-thick border-primary shadow-md grid place-items-center shrink-0"
		style={`background:${accent};transform:rotate(-4deg)`}
	>
		<span class="font-bricolage font-extrabold text-6xl text-primary" style="transform:rotate(4deg)"
			>T</span
		>
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
		<svg
			width="21"
			height="21"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2.1"
			stroke-linecap="round"
			stroke-linejoin="round"
			><circle cx="12" cy="12" r="3"></circle><path
				d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
			></path></svg
		>
	</button>
</div>
