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

<!-- Backdrop -->
<div
	class="fixed inset-0 z-50 flex justify-center items-center px-4 pb-4 bg-black/65 opacity-0 pointer-events-none transition-opacity duration-250"
	class:!opacity-100={open}
	class:!pointer-events-auto={open}
	onclick={onClose}
	onkeydown={(e) => e.key === 'Escape' && onClose()}
	role="dialog"
	aria-modal="true"
	tabindex="-1"
>
	<!-- Receipt wrapper — drop-shadow traces the zigzag silhouette -->
	<div
		class="relative flex flex-col w-full max-w-75 translate-y-16 transition-transform duration-350 ease-out"
		class:!translate-y-0={open}
		style="filter: drop-shadow(0 -6px 28px rgba(0,0,0,0.28)) drop-shadow(0 2px 8px rgba(0,0,0,0.15));"
		onclick={(e) => e.stopPropagation()}
		role="presentation"
	>
		<!-- ── Top torn edge ── -->
		<svg
			width="100%"
			height="12"
			viewBox="0 0 300 12"
			preserveAspectRatio="none"
			xmlns="http://www.w3.org/2000/svg"
			style="display:block;"
		>
			<path
				d="M0,12 L0,8 L6,0 L12,8 L18,0 L24,8 L30,0 L36,8 L42,0 L48,8 L54,0 L60,8 L66,0 L72,8 L78,0 L84,8 L90,0 L96,8 L102,0 L108,8 L114,0 L120,8 L126,0 L132,8 L138,0 L144,8 L150,0 L156,8 L162,0 L168,8 L174,0 L180,8 L186,0 L192,8 L198,0 L204,8 L210,0 L216,8 L222,0 L228,8 L234,0 L240,8 L246,0 L252,8 L258,0 L264,8 L270,0 L276,8 L282,0 L288,8 L294,0 L300,8 L300,12 Z"
				fill="#fef9ef"
			/>
		</svg>

		<!-- ── Close button (floats above body) ── -->
		<button
			class="absolute top-[14px] right-3 z-10 w-5 h-5 flex items-center justify-center font-mono text-[13px] leading-none text-[#9a8e78] hover:text-[#211e1a] transition-colors"
			type="button"
			aria-label="Close"
			onclick={onClose}>×</button
		>

		<!-- ── Receipt body ── -->
		<div class="bg-[#fef9ef] flex-1 overflow-y-auto px-5 -my-px" style="max-height: 72vh;">
			<!-- Store header -->
			<div class="text-center pt-4 pb-3">
				<div class="font-mono font-bold text-[15px] tracking-[0.2em] text-[#211e1a]">
					CLEAR THE TAB
				</div>
				<div class="font-mono text-[8px] tracking-[0.14em] text-[#9a8e78] mt-0.5 uppercase">
					{t.tableReceipt}
				</div>
				<div class="mt-2.5 border-t border-dashed border-[#c8bca6]"></div>
			</div>

			{#if canSettle}
				<!-- Receipt meta / date -->
				{#if receiptMeta}
					<div class="font-mono text-[9px] tracking-[0.06em] text-[#9a8e78] text-center mb-1">
						{receiptMeta}
					</div>
				{/if}
				{#if showPaidBy}
					<div class="font-mono text-[9px] text-center text-[#9a8e78] mb-1">{paidByLine}</div>
				{/if}

				<!-- ── Who pays whom ── -->
				{#if transfers.length}
					<div class="border-t border-dashed border-[#c8bca6] my-2.5"></div>
					<div
						class="font-mono text-[8px] tracking-[0.14em] text-[#9a8e78] text-center mb-2.5 uppercase"
					>
						{t.paysWhom}
					</div>
					{#each transfers as tr}
						<div class="flex justify-between font-mono text-[11px] text-[#211e1a] font-bold mb-0.5">
							<span>{tr.from.name}</span>
							<span>{tr.amount.toFixed(2)}</span>
						</div>
						<div class="font-mono text-[9px] text-[#9a8e78] mb-2 pl-2">
							↳ {t.payVerb}
							{tr.to.name}
						</div>
					{/each}
				{:else}
					<div
						class="font-mono font-bold text-[12px] text-[#1e9e6a] text-center my-3 tracking-[0.06em]"
					>
						✓ {t.allSettled}
					</div>
				{/if}

				<!-- ── Per-person shares (no paid-by set) ── -->
				{#if !showPaidBy}
					<div class="border-t border-dashed border-[#c8bca6] my-2.5"></div>
					{#each [...shares].sort((a, b) => b.total - a.total) as s}
						<div class="flex justify-between font-mono text-[11px] text-[#211e1a] py-[3px]">
							<span>{s.name}</span>
							<span>{s.total.toFixed(2)}</span>
						</div>
					{/each}
					<div class="font-mono text-[8px] text-[#9a8e78] text-center mt-1">{t.pickPaidHint}</div>
				{/if}

				<!-- ── Totals ── -->
				<div class="border-t border-dashed border-[#c8bca6] my-2.5"></div>
				<div class="flex justify-between font-mono text-[11px] text-[#211e1a] py-[3px]">
					<span>{t.subtotal}</span><span>{subtotalLabel}</span>
				</div>
				{#if showTip}
					<div class="flex justify-between font-mono text-[11px] text-[#211e1a] py-[3px]">
						<span>{t.tip}</span><span>{tipLabel}</span>
					</div>
				{/if}
				{#if showExtra}
					<div class="flex justify-between font-mono text-[11px] text-[#211e1a] py-[3px]">
						<span>{t.extra}</span><span>{extraLabel}</span>
					</div>
				{/if}

				<!-- Grand total — bold rule above -->
				<div class="border-t-[1.5px] border-[#211e1a]/20 my-2"></div>
				<div class="flex justify-between font-mono font-bold text-[15px] text-[#211e1a]">
					<span>{t.total}</span><span>{grandLabel}</span>
				</div>

				<!-- ── Footer decoration ── -->
				<div class="border-t border-dashed border-[#c8bca6] mt-4 mb-3"></div>
				<div class="font-mono text-[7.5px] tracking-[0.1em] text-[#b3a48e] text-center mb-3">
					* * * THANK YOU * * *
				</div>

				<!-- Barcode -->
				<div class="flex flex-col items-center mb-3 gap-1">
					<div
						class="h-7 w-[128px] rounded-[1px] opacity-50"
						style="background: repeating-linear-gradient(to right,
							#211e1a 0px, #211e1a 1.5px,
							transparent 1.5px, transparent 2.5px,
							#211e1a 2.5px, #211e1a 4.5px,
							transparent 4.5px, transparent 5.5px,
							#211e1a 5.5px, #211e1a 8px,
							transparent 8px, transparent 9px,
							#211e1a 9px, #211e1a 10.5px,
							transparent 10.5px, transparent 12px,
							#211e1a 12px, #211e1a 13px,
							transparent 13px, transparent 15px,
							#211e1a 15px, #211e1a 17.5px,
							transparent 17.5px, transparent 19px,
							#211e1a 19px, #211e1a 20px,
							transparent 20px, transparent 22px
						);"
					></div>
					<div class="font-mono text-[7px] tracking-[0.16em] text-[#b3a48e]">0 0 1 2 3 4 5 6 7</div>
				</div>

				<!-- ── Action buttons ── -->
				<div class="flex flex-col gap-2 pb-4">
					<button
						type="button"
						class="h-10 border-[2px] border-[#211e1a] rounded-[3px] bg-[#211e1a] text-[#fef9ef] font-mono text-[11px] font-bold tracking-[0.1em] cursor-pointer"
						onclick={onCopy}>{copyLabel}</button
					>
				</div>
			{:else}
				<div class="text-center font-mono text-[11px] text-[#9a8e78] py-8">{t.nothing}</div>
			{/if}
		</div>

		<!-- ── Bottom torn edge ── -->
		<svg
			width="100%"
			height="12"
			viewBox="0 0 300 12"
			preserveAspectRatio="none"
			xmlns="http://www.w3.org/2000/svg"
			style="display:block;"
		>
			<path
				d="M0,0 L300,0 L300,4 L294,12 L288,4 L282,12 L276,4 L270,12 L264,4 L258,12 L252,4 L246,12 L240,4 L234,12 L228,4 L222,12 L216,4 L210,12 L204,4 L198,12 L192,4 L186,12 L180,4 L174,12 L168,4 L162,12 L156,4 L150,12 L144,4 L138,12 L132,4 L126,12 L120,4 L114,12 L108,4 L102,12 L96,4 L90,12 L84,4 L78,12 L72,4 L66,12 L60,4 L54,12 L48,4 L42,12 L36,4 L30,12 L24,4 L18,12 L12,4 L6,12 L0,4 Z"
				fill="#fef9ef"
			/>
		</svg>
	</div>
</div>
