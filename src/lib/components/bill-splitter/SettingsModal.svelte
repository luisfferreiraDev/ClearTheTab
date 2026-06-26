<script lang="ts">
	import { CURRENCIES, LANGS } from './constants';
	import type { I18n, Lang } from './types';

	const CURRENCY_DISPLAY: Record<(typeof CURRENCIES)[number], string> = {
		EUR: '€',
		USD: '$',
		GBP: '£'
	};

	let {
		open = false,
		t,
		lang,
		currency,
		onClose = () => {},
		onLang = () => {},
		onCurrency = () => {},
		onReset = () => {}
	}: {
		open?: boolean;
		t: I18n;
		lang: Lang;
		currency: (typeof CURRENCIES)[number];
		onClose?: () => void;
		onLang?: (value: Lang) => void;
		onCurrency?: (value: (typeof CURRENCIES)[number]) => void;
		onReset?: () => void;
	} = $props();
</script>

<!-- Backdrop -->
<div
	class="fixed inset-0 z-60 grid place-items-center px-5 bg-black/50 opacity-0 pointer-events-none transition-opacity duration-200"
	class:!opacity-100={open}
	class:!pointer-events-auto={open}
	onclick={onClose}
>
	<!-- Card -->
	<div
		class="w-[min(90vw,360px)] bg-surface-light border-thick border-primary rounded-3xl shadow-xl overflow-hidden scale-95 opacity-0 transition-all duration-200"
		class:!scale-100={open}
		class:!opacity-100={open}
		onclick={(e) => e.stopPropagation()}
	>
		<!-- Header -->
		<div class="flex justify-between items-center px-5 pt-5 pb-4">
			<h3 class="m-0 font-bricolage font-extrabold text-4xl">{t.settings}</h3>
			<button
				type="button"
				class="w-8 h-8 border-thick border-primary rounded-full bg-white cursor-pointer grid place-items-center text-primary hover:bg-primary hover:text-white transition-colors duration-150"
				onclick={onClose}
				aria-label="Close"
			>
				<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
					<line x1="1.5" y1="1.5" x2="8.5" y2="8.5" />
					<line x1="8.5" y1="1.5" x2="1.5" y2="8.5" />
				</svg>
			</button>
		</div>

		<div class="px-5 pb-5 flex flex-col gap-4">
			<!-- Language -->
			<div>
				<div class="text-xs font-bricolage font-extrabold tracking-xl text-muted mb-2">
					{t.language}
				</div>
				<div class="grid grid-cols-2 gap-2">
					{#each LANGS as option (option.code)}
						<button
							type="button"
							class:border-primary={lang === option.code}
							class:bg-primary={lang === option.code}
							class:text-white={lang === option.code}
							class="h-11 px-4 rounded-xl border-thick border-border-light bg-white font-bricolage font-bold text-xl cursor-pointer transition-colors duration-150"
							onclick={() => onLang(option.code)}
						>
							{option.label}
						</button>
					{/each}
				</div>
			</div>

			<!-- Currency -->
			<div>
				<div class="text-xs font-bricolage font-extrabold tracking-xl text-muted mb-2">
					{t.currency}
				</div>
				<div class="flex gap-2">
					{#each CURRENCIES as code (code)}
						<button
							type="button"
							class:border-primary={currency === code}
							class:bg-primary={currency === code}
							class:text-white={currency === code}
							class="flex-1 h-14 rounded-xl border-thick border-border-light bg-white cursor-pointer transition-colors duration-150 flex flex-col items-center justify-center gap-0.5"
							onclick={() => onCurrency(code)}
						>
							<span class="font-bricolage font-extrabold text-4xl leading-none">{CURRENCY_DISPLAY[code]}</span>
							<span class="font-mono text-[9px] tracking-lg opacity-60 leading-none">{code}</span>
						</button>
					{/each}
				</div>
			</div>

			<!-- Divider -->
			<div class="border-t border-border-lighter -mx-5"></div>

			<!-- Actions -->
			<div class="flex flex-col gap-2">
				<button
					class="w-full h-11 border-thick border-border-light rounded-xl text-muted font-bricolage font-extrabold text-xl cursor-pointer hover:border-primary hover:text-primary transition-colors duration-150"
					type="button"
					onclick={onReset}
				>{t.resetTab}</button>
				<button
					class="w-full h-12 border-thick border-primary rounded-xl text-white font-bricolage font-extrabold text-xl cursor-pointer transition-opacity hover:opacity-90 bg-accent"
					type="button"
					onclick={onClose}
				>{t.done}</button>
			</div>
		</div>
	</div>
</div>
