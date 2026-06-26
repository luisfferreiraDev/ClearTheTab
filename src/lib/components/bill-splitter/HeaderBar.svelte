<script lang="ts">
	import type { I18n } from './types';
	import { createEventDispatcher } from 'svelte';

	let { t, accent = '#FF6A3D' }: { t: I18n; accent?: string } = $props();

	const dispatch = createEventDispatcher<{ settings: void }>();
</script>

<div class="header-row">
	<div class="logo" style={`background:${accent}`}>
		<span>T</span>
	</div>
	<div class="title-wrap">
		<h1>Clear The Tab</h1>
		<p>{t.subtitle}</p>
	</div>
	<button
		class="settings"
		type="button"
		on:click={() => dispatch('settings')}
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

<style>
	.header-row {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 2px 4px;
	}
	.logo {
		width: 46px;
		height: 46px;
		border-radius: 14px;
		border: 2.5px solid #211e1a;
		box-shadow: 3px 3px 0 #211e1a;
		display: grid;
		place-items: center;
		transform: rotate(-4deg);
		flex-shrink: 0;
	}
	.logo span {
		font:
			800 24px 'Bricolage Grotesque',
			system-ui;
		color: #211e1a;
		transform: rotate(4deg);
	}
	.title-wrap {
		min-width: 0;
		flex: 1;
	}
	h1 {
		margin: 0;
		font:
			800 22px 'Bricolage Grotesque',
			system-ui;
		letter-spacing: -0.02em;
		color: #211e1a;
		line-height: 1.05;
	}
	p {
		margin: 1px 0 0;
		font-size: 12.5px;
		color: #8a7e6a;
		font-weight: 600;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.settings {
		width: 44px;
		height: 44px;
		flex-shrink: 0;
		border: 2.5px solid #211e1a;
		border-radius: 13px;
		background: #fff;
		box-shadow: 3px 3px 0 #211e1a;
		cursor: pointer;
		display: grid;
		place-items: center;
		color: #211e1a;
	}
</style>
