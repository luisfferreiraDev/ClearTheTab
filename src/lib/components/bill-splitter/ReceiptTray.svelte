<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { I18n, PersonShare, Transfer } from './types';

	let {
		open = false,
		t,
		canSettle = false,
		receiptMeta = '',
		paidByLine = '',
		showPaidBy = false,
		transfers = [],
		shares = [],
		subtotalLabel = '',
		tipLabel = '',
		showTip = false,
		extraLabel = '',
		showExtra = false,
		grandLabel = '',
		copyLabel = '',
		shareLabel = ''
	}: {
		open?: boolean;
		t: I18n;
		canSettle?: boolean;
		receiptMeta?: string;
		paidByLine?: string;
		showPaidBy?: boolean;
		transfers?: Transfer[];
		shares?: PersonShare[];
		subtotalLabel?: string;
		tipLabel?: string;
		showTip?: boolean;
		extraLabel?: string;
		showExtra?: boolean;
		grandLabel?: string;
		copyLabel?: string;
		shareLabel?: string;
	} = $props();

	const dispatch = createEventDispatcher<{ close: void; copy: void; share: void }>();
</script>

<div class:open class="overlay" on:click={() => dispatch('close')}>
	<div class="sheet" on:click|stopPropagation>
		<button class="close" type="button" on:click={() => dispatch('close')}>x</button>
		<div class="brand">CLEAR THE TAB</div>
		<div class="meta">{t.tableReceipt}</div>

		{#if canSettle}
			<div class="line strong">{receiptMeta}</div>
			{#if showPaidBy}
				<div class="line">{paidByLine}</div>
			{/if}
			<hr />

			{#if transfers.length}
				<div class="line strong">{t.paysWhom}</div>
				{#each transfers as tr}
					<div class="row">
						<span>{tr.from.name}</span>
						<span>{tr.amount.toFixed(2)}</span>
					</div>
					<div class="row soft">
						<span>{t.payVerb}</span>
						<span>{tr.to.name}</span>
					</div>
				{/each}
			{:else}
				<div class="line success">{t.allSettled}</div>
			{/if}

			{#if !showPaidBy}
				<hr />
				{#each [...shares].sort((a, b) => b.total - a.total) as s}
					<div class="row"><span>{s.name}</span><span>{s.total.toFixed(2)}</span></div>
				{/each}
				<div class="line hint">{t.pickPaidHint}</div>
			{/if}

			<hr />
			<div class="row"><span>{t.subtotal}</span><span>{subtotalLabel}</span></div>
			{#if showTip}
				<div class="row"><span>{t.tip}</span><span>{tipLabel}</span></div>
			{/if}
			{#if showExtra}
				<div class="row"><span>{t.extra}</span><span>{extraLabel}</span></div>
			{/if}
			<div class="row total"><span>{t.total}</span><span>{grandLabel}</span></div>

			<div class="actions">
				<button type="button" class="accent" on:click={() => dispatch('copy')}>{copyLabel}</button>
				<button type="button" on:click={() => dispatch('share')}>{shareLabel}</button>
			</div>
		{:else}
			<div class="empty">{t.nothing}</div>
		{/if}
	</div>
</div>

<style>
	.overlay {
		position: fixed;
		inset: 0;
		z-index: 50;
		display: flex;
		justify-content: flex-end;
		align-items: center;
		padding: 16px;
		background: rgba(28, 22, 14, 0.5);
		opacity: 0;
		pointer-events: none;
		transition: opacity 0.25s ease;
	}
	.overlay.open {
		opacity: 1;
		pointer-events: auto;
	}
	.sheet {
		position: relative;
		width: min(86vw, 332px);
		max-height: 90vh;
		overflow-y: auto;
		background: #fffdf7;
		border-radius: 16px;
		padding: 18px;
	}
	.close {
		position: absolute;
		top: 10px;
		right: 10px;
		width: 28px;
		height: 28px;
		border: 2px solid #211e1a;
		border-radius: 50%;
		background: #fff;
		cursor: pointer;
	}
	.brand {
		font:
			700 16px 'Space Mono',
			monospace;
		letter-spacing: 0.14em;
		text-align: center;
	}
	.meta {
		font:
			400 11px 'Space Mono',
			monospace;
		letter-spacing: 0.09em;
		color: #8a7e6a;
		text-align: center;
		margin-top: 4px;
	}
	.line {
		font:
			400 11px 'Space Mono',
			monospace;
		text-align: center;
		margin: 8px 0;
	}
	.line.strong {
		font-weight: 700;
	}
	.line.success {
		font:
			700 13px 'Bricolage Grotesque',
			system-ui;
		color: #1e9e6a;
	}
	.line.hint {
		font-size: 10px;
		color: #8a7e6a;
	}
	.row {
		display: flex;
		justify-content: space-between;
		font:
			400 12px 'Space Mono',
			monospace;
		color: #6e6553;
		padding: 2px 0;
	}
	.row.soft {
		font-size: 11px;
		color: #8a7e6a;
		margin-bottom: 6px;
	}
	.row.total {
		font-weight: 700;
		font-size: 16px;
		color: #1c1a17;
		padding-top: 8px;
	}
	hr {
		border: none;
		border-top: 2px dashed #d8cdb6;
		margin: 8px 0;
	}
	.actions {
		display: flex;
		gap: 9px;
		margin-top: 12px;
	}
	.actions button {
		flex: 1;
		height: 46px;
		border: 2.5px solid #211e1a;
		border-radius: 13px;
		background: #fff;
		font:
			700 14px 'Bricolage Grotesque',
			system-ui;
		cursor: pointer;
	}
	.actions .accent {
		background: var(--accent, #ff6a3d);
	}
	.empty {
		padding: 24px 10px;
		text-align: center;
		font:
			700 14px 'Bricolage Grotesque',
			system-ui;
		color: #56503f;
	}
</style>
