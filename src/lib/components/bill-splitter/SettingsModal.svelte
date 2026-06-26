<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { CURRENCIES, LANGS } from './constants';
	import type { I18n, Lang } from './types';

	let {
		open = false,
		t,
		lang,
		currency
	}: {
		open?: boolean;
		t: I18n;
		lang: Lang;
		currency: (typeof CURRENCIES)[number];
	} = $props();

	const dispatch = createEventDispatcher<{
		close: void;
		lang: { value: Lang };
		currency: { value: (typeof CURRENCIES)[number] };
	}>();
</script>

<div class:open class="overlay" on:click={() => dispatch('close')}>
	<div class="modal" on:click|stopPropagation>
		<div class="head">
			<h3>{t.settings}</h3>
			<button type="button" on:click={() => dispatch('close')}>x</button>
		</div>

		<div class="label">{t.language}</div>
		<div class="stack">
			{#each LANGS as option (option.code)}
				<button
					type="button"
					class:active={lang === option.code}
					on:click={() => dispatch('lang', { value: option.code })}
				>
					{option.label}
				</button>
			{/each}
		</div>

		<div class="label">{t.currency}</div>
		<div class="row">
			{#each CURRENCIES as code (code)}
				<button
					type="button"
					class:active={currency === code}
					on:click={() => dispatch('currency', { value: code })}
				>
					{code}
				</button>
			{/each}
		</div>

		<button class="done" type="button" on:click={() => dispatch('close')}>{t.done}</button>
	</div>
</div>

<style>
	.overlay {
		position: fixed;
		inset: 0;
		z-index: 60;
		display: grid;
		place-items: center;
		padding: 20px;
		background: rgba(28, 22, 14, 0.5);
		opacity: 0;
		pointer-events: none;
		transition: opacity 0.2s ease;
	}
	.overlay.open {
		opacity: 1;
		pointer-events: auto;
	}
	.modal {
		width: min(90vw, 344px);
		background: #fff;
		border: 2.5px solid #211e1a;
		border-radius: 22px;
		box-shadow: 5px 5px 0 #211e1a;
		padding: 18px;
	}
	.head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16px;
	}
	h3 {
		margin: 0;
		font:
			800 19px 'Bricolage Grotesque',
			system-ui;
	}
	.head button {
		width: 30px;
		height: 30px;
		border: 2px solid #211e1a;
		border-radius: 50%;
		background: #fff;
		cursor: pointer;
	}
	.label {
		font:
			800 11px 'Bricolage Grotesque',
			system-ui;
		letter-spacing: 0.04em;
		color: #8a7e6a;
		margin-bottom: 8px;
	}
	.stack {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-bottom: 16px;
	}
	.row {
		display: flex;
		gap: 8px;
		margin-bottom: 18px;
	}
	button {
		height: 48px;
		padding: 0 14px;
		border-radius: 13px;
		border: 2.5px solid #cfc4ae;
		background: #fff;
		font:
			700 15px 'Bricolage Grotesque',
			system-ui;
		cursor: pointer;
	}
	.row button {
		flex: 1;
		font-family: 'Space Mono', monospace;
	}
	button.active {
		border-color: #211e1a;
		background: #211e1a;
		color: #fff;
	}
	.done {
		width: 100%;
		height: 50px;
		border-color: #211e1a;
		background: var(--accent, #ff6a3d);
		color: #211e1a;
		font-weight: 800;
	}
</style>
