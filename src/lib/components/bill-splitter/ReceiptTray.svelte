<script lang="ts">
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
		shareLabel = '',
		onClose = () => {},
		onCopy = () => {},
		onShare = () => {}
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
		onClose?: () => void;
		onCopy?: () => void;
		onShare?: () => void;
	} = $props();
</script>

<div
	class:open
	class="fixed inset-0 z-50 flex justify-end items-center px-4 bg-black/50 opacity-0 pointer-events-none transition-opacity duration-200"
	class:!opacity-100={open}
	class:!pointer-events-auto={open}
	onclick={onClose}
>
	<div
		class="relative w-min(86vw, 332px) max-h-90vh overflow-y-auto bg-surface-lighter rounded-2xl p-5"
		onclick={(e) => e.stopPropagation()}
	>
		<button
			class="absolute top-2.5 right-2.5 w-7 h-7 border-2 border-primary rounded-full bg-white cursor-pointer"
			type="button"
			onclick={onClose}>x</button
		>
		<div class="font-mono font-bold text-3xl tracking-xl text-center">CLEAR THE TAB</div>
		<div class="font-mono text-xs tracking-lg text-muted text-center mt-1">{t.tableReceipt}</div>

		{#if canSettle}
			<div class="font-mono text-xs tracking-lg font-bold text-center my-2">{receiptMeta}</div>
			{#if showPaidBy}
				<div class="font-mono text-xs text-center">{paidByLine}</div>
			{/if}
			<hr class="border-t-2 border-dashed border-border-light my-2" />

			{#if transfers.length}
				<div class="font-mono text-xs tracking-lg font-bold text-center my-2">{t.paysWhom}</div>
				{#each transfers as tr}
					<div class="flex justify-between font-mono text-sm">
						<span>{tr.from.name}</span>
						<span>{tr.amount.toFixed(2)}</span>
					</div>
					<div class="flex justify-between font-mono text-xs text-muted-light mb-1.5">
						<span>{t.payVerb}</span>
						<span>{tr.to.name}</span>
					</div>
				{/each}
			{:else}
				<div class="font-bricolage font-bold text-lg text-success text-center my-2">
					{t.allSettled}
				</div>
			{/if}

			{#if !showPaidBy}
				<hr class="border-t-2 border-dashed border-border-light my-2" />
				{#each [...shares].sort((a, b) => b.total - a.total) as s}
					<div class="flex justify-between font-mono text-sm">
						<span>{s.name}</span><span>{s.total.toFixed(2)}</span>
					</div>
				{/each}
				<div class="font-mono text-xs text-muted text-center my-1">{t.pickPaidHint}</div>
			{/if}

			<hr class="border-t-2 border-dashed border-border-light my-2" />
			<div class="flex justify-between font-mono text-sm">
				<span>{t.subtotal}</span><span>{subtotalLabel}</span>
			</div>
			{#if showTip}
				<div class="flex justify-between font-mono text-sm">
					<span>{t.tip}</span><span>{tipLabel}</span>
				</div>
			{/if}
			{#if showExtra}
				<div class="flex justify-between font-mono text-sm">
					<span>{t.extra}</span><span>{extraLabel}</span>
				</div>
			{/if}
			<div class="flex justify-between font-mono font-bold text-2xl pt-2 my-2">
				<span>{t.total}</span><span>{grandLabel}</span>
			</div>

			<div class="flex flex-col gap-2 mt-4">
				<button
					type="button"
					class="h-12 border-thick border-primary rounded-md text-primary font-bricolage font-bold cursor-pointer"
					style={`background-color: var(--accent, #ff6a3d)`}
					onclick={onCopy}>{copyLabel}</button
				>
				<button
					type="button"
					class="h-12 border-thick border-primary rounded-md bg-white text-primary font-bricolage font-bold cursor-pointer"
					onclick={onShare}>{shareLabel}</button
				>
			</div>
		{:else}
			<div class="text-center font-bricolage font-bold text-lg mt-4">{t.nothing}</div>
		{/if}
	</div>
</div>
