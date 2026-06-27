<script lang="ts">
	import { onMount } from 'svelte';
	import type { I18n } from './types';

	let {
		open = false,
		canInstall = false,
		t,
		onClose = () => {},
		onInstallNative = () => {}
	}: {
		open?: boolean;
		canInstall?: boolean;
		t: I18n;
		onClose?: () => void;
		onInstallNative?: () => void;
	} = $props();

	type Platform = 'ios' | 'android' | 'desktop' | 'other';
	let platform = $state<Platform>('other');

	onMount(() => {
		const ua = navigator.userAgent;
		if (/iPhone|iPad|iPod/.test(ua)) platform = 'ios';
		else if (/Android/.test(ua)) platform = 'android';
		else platform = 'desktop';
	});

	type Step = { text: string };

	const STEPS: Record<Platform, Step[]> = {
		ios: [
			{ text: 'Open this page in Safari (not Chrome or Firefox)' },
			{ text: 'Tap the Share button at the bottom of the screen' },
			{ text: 'Scroll down and tap "Add to Home Screen"' },
			{ text: 'Tap "Add" to confirm' }
		],
		android: [
			{ text: 'Tap the menu button (⋮) in the top right of your browser' },
			{ text: 'Tap "Add to Home Screen" or "Install app"' },
			{ text: 'Follow the prompts to install' }
		],
		desktop: [
			{ text: 'Look for the install icon (⊕) at the right of the address bar' },
			{ text: 'Or open the browser menu → "Install Clear The Tab"' },
			{ text: 'Click "Install" to confirm' }
		],
		other: [
			{ text: 'Open your browser menu' },
			{ text: 'Look for "Add to Home Screen" or "Install app"' },
			{ text: 'Follow the prompts to install' }
		]
	};

	const steps = $derived(STEPS[platform]);
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="fixed inset-0 z-70 grid place-items-center px-5 bg-black/50 opacity-0 pointer-events-none transition-opacity duration-200"
	class:!opacity-100={open}
	class:!pointer-events-auto={open}
	onclick={onClose}
>
	<div
		class="w-[min(90vw,360px)] bg-surface-light border-thick border-primary rounded-3xl shadow-xl overflow-hidden scale-95 opacity-0 transition-all duration-200"
		class:!scale-100={open}
		class:!opacity-100={open}
		onclick={(e) => e.stopPropagation()}
	>
		<!-- Header -->
		<div class="flex justify-between items-center px-5 pt-5 pb-4">
			<h3 class="m-0 font-bricolage font-extrabold text-4xl">{t.installApp}</h3>
			<button
				type="button"
				class="w-8 h-8 border-thick border-primary rounded-full bg-white cursor-pointer grid place-items-center text-primary hover:bg-primary hover:text-white transition-colors duration-150"
				onclick={onClose}
				aria-label="Close"
			>
				<svg
					width="10"
					height="10"
					viewBox="0 0 10 10"
					fill="none"
					stroke="currentColor"
					stroke-width="2.5"
					stroke-linecap="round"
				>
					<line x1="1.5" y1="1.5" x2="8.5" y2="8.5" />
					<line x1="8.5" y1="1.5" x2="1.5" y2="8.5" />
				</svg>
			</button>
		</div>

		<div class="px-5 pb-5 flex flex-col gap-4">
			<!-- Native install button (Chrome/Edge/Android when prompt is available) -->
			{#if canInstall}
				<button
					type="button"
					class="w-full h-12 border-thick border-primary rounded-xl text-white font-bricolage font-extrabold text-xl cursor-pointer transition-opacity hover:opacity-90 bg-accent flex items-center justify-center gap-2"
					onclick={onInstallNative}
				>
					<svg
						width="16"
						height="16"
						viewBox="0 0 16 16"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M8 1v9M4 7l4 4 4-4" />
						<path d="M1 12v2a1 1 0 001 1h12a1 1 0 001-1v-2" />
					</svg>
					Install now
				</button>
				<div class="flex items-center gap-3 -mt-1">
					<div class="flex-1 border-t border-border-lighter"></div>
					<span class="text-xs font-mono text-muted">or follow these steps</span>
					<div class="flex-1 border-t border-border-lighter"></div>
				</div>
			{/if}

			<!-- Step-by-step instructions -->
			<div class="flex flex-col gap-3">
				{#each steps as step, i}
					<div class="flex items-start gap-3">
						<div
							class="w-6 h-6 rounded-full border-2 border-primary flex items-center justify-center flex-shrink-0 font-mono font-bold text-xs text-primary"
						>
							{i + 1}
						</div>
						<p class="font-mono text-sm text-primary leading-snug pt-0.5 m-0">{step.text}</p>
					</div>
				{/each}
			</div>

			<!-- iOS share icon hint -->
			{#if platform === 'ios'}
				<div class="bg-[#f5f0e8] rounded-xl px-4 py-3 flex items-center gap-3">
					<svg
						width="22"
						height="22"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="text-primary flex-shrink-0"
					>
						<path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
						<polyline points="16 6 12 2 8 6" />
						<line x1="12" y1="2" x2="12" y2="15" />
					</svg>
					<span class="font-mono text-xs text-muted leading-snug"
						>This is the Share icon — look for it at the bottom of your Safari browser</span
					>
				</div>
			{/if}

			<button
				class="w-full h-11 border-thick border-border-light rounded-xl text-muted font-bricolage font-extrabold text-xl cursor-pointer hover:border-primary hover:text-primary transition-colors duration-150"
				type="button"
				onclick={onClose}
			>{t.done}</button>
		</div>
	</div>
</div>
