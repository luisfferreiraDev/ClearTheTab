<script lang="ts">
	import { CURRENCIES, LANGS } from './constants';
	import type { I18n, Lang } from './types';

	let {
		open = false,
		t,
		lang,
		currency,
		onClose = () => {},
		onLang = () => {},
		onCurrency = () => {}
	}: {
		open?: boolean;
		t: I18n;
		lang: Lang;
		currency: (typeof CURRENCIES)[number];
		onClose?: () => void;
		onLang?: (value: Lang) => void;
		onCurrency?: (value: (typeof CURRENCIES)[number]) => void;
	} = $props();
</script>

<div
	class:open
	class="fixed inset-0 z-60 grid place-items-center px-5 bg-black/50 opacity-0 pointer-events-none transition-opacity duration-200"
	class:!opacity-100={open}
	class:!pointer-events-auto={open}
	onclick={onClose}
>
	<div
		class="w-min(90vw, 344px) bg-white border-thick border-primary rounded-3xl shadow-xl p-5"
		onclick={(e) => e.stopPropagation()}
	>
		<div class="flex justify-between items-center mb-4">
			<h3 class="m-0 font-bricolage font-extrabold text-4xl">{t.settings}</h3>
			<button
				type="button"
				class="w-8 h-8 border-2 border-primary rounded-full bg-white cursor-pointer"
				onclick={onClose}>x</button
			>
		</div>

		<div class="text-xs font-bricolage font-extrabold tracking-sm text-muted mb-2">
			{t.language}
		</div>
		<div class="flex flex-col gap-2 mb-4">
			{#each LANGS as option (option.code)}
				<button
					type="button"
					class:border-primary={lang === option.code}
					class:bg-primary={lang === option.code}
					class:text-white={lang === option.code}
					class="h-12 px-4 rounded-md border-thick border-border-light bg-white font-bricolage font-bold text-2xl-0.5 cursor-pointer"
					onclick={() => onLang(option.code)}
				>
					{option.label}
				</button>
			{/each}
		</div>

		<div class="text-xs font-bricolage font-extrabold tracking-sm text-muted mb-2">
			{t.currency}
		</div>
		<div class="flex gap-2 mb-4">
			{#each CURRENCIES as code (code)}
				<button
					type="button"
					class:border-primary={currency === code}
					class:bg-primary={currency === code}
					class:text-white={currency === code}
					class="flex-1 h-12 px-4 rounded-md border-thick border-border-light bg-white font-mono font-bold text-2xl-0.5 cursor-pointer"
					onclick={() => onCurrency(code)}
				>
					{code}
				</button>
			{/each}
		</div>

		<button
			class="w-full h-12 border-thick border-primary rounded-md text-primary font-bricolage font-extrabold text-2xl-0.5 cursor-pointer"
			type="button"
			style={`background-color: var(--accent, #ff6a3d)`}
			onclick={onClose}>{t.done}</button
		>
	</div>
</div>
