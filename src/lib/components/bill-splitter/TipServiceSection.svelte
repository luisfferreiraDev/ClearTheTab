<script lang="ts">
	import type { I18n } from './types';

	let {
		t,
		tip = 0,
		tipAmountLabel = '',
		currencySymbol = '',
		fixedValue = '',
		customTipEur = 0,
		customTipEurValue = '',
		onTipChange = () => {},
		onFixedChange = () => {},
		onCustomTipEurChange = () => {}
	}: {
		t: I18n;
		tip?: number;
		tipAmountLabel?: string;
		currencySymbol?: string;
		fixedValue?: string;
		customTipEur?: number;
		customTipEurValue?: string;
		onTipChange?: (value: number) => void;
		onFixedChange?: (value: number) => void;
		onCustomTipEurChange?: (raw: string, value: number) => void;
	} = $props();
</script>

<section class="bg-white border-thick border-primary rounded-3xl shadow-lg p-4 flex flex-col gap-4">
	<div class="flex items-center justify-between gap-2">
		<div class="text-muted text-xs font-bricolage font-extrabold tracking-xs">
			{t.tipService}
		</div>
		<div class="text-success text-lg-0.5 font-mono font-bold">
			{tip === 0 && customTipEur === 0 ? t.none : `+${tipAmountLabel}`}
		</div>
	</div>
	<div class="grid md:grid-cols-4 gap-2 grid-cols-2">
		{#each [0, 5, 10] as option}
			{@const isSelected = tip === option && customTipEurValue === ''}
			<button
				type="button"
				class="px-4 border-2 h-12 rounded-sm transition-all font-mono font-bold cursor-pointer text-2xl-0.5 {isSelected
					? ' bg-black text-white shadow-accent shadow-sm border-black'
					: '  text-muted-light border-muted-light'}"
				onclick={() => onTipChange(option)}>{option}%</button
			>
		{/each}
		<div
			class="relative border-2 h-12 rounded-sm transition-all {customTipEur > 0
				? 'bg-black border-black shadow-accent shadow-sm'
				: 'border-muted-light'}"
		>
			<span
				class="absolute left-2 top-1/2 -translate-y-1/2 font-mono font-bold text-2xl-0.5 pointer-events-none {customTipEur >
				0
					? 'text-white'
					: 'text-muted-light'}">{currencySymbol}</span
			>
			<input
				type="text"
				inputmode="decimal"
				value={customTipEurValue}
				oninput={(event) => {
					const raw = (event.currentTarget as HTMLInputElement).value;
					const value = Number.parseFloat(raw.replace(',', '.'));
					onCustomTipEurChange(raw, Number.isNaN(value) || value <= 0 ? 0 : value);
				}}
				placeholder="—"
				class="absolute inset-0 w-full h-full pl-8 pr-2 bg-transparent font-mono font-bold text-2xl-0.5 outline-none indent-4 rounded-sm {customTipEur >
				0
					? 'text-white placeholder:text-white/40'
					: 'text-muted-light'}"
			/>
		</div>
	</div>
	<div
		class="h-0.5 bg-repeat-x"
		style="background-image: repeating-linear-gradient(90deg, #e0d4bd 0 7px, transparent 7px 13px)"
	></div>
	<div class="flex justify-between md:items-center gap-lg flex-col md:flex-row items-stretch gap-4">
		<div>
			<div class="text-xl font-bold text-primary-light">{t.sharedExtra}</div>
			<div class="text-xs text-muted font-bold">{t.sharedExtraSub}</div>
		</div>
		<div class="relative md:w-35 shrink-0 w-full">
			<span class="absolute left-3 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-lighter"
				>{currencySymbol}</span
			>
			<input
				type="text"
				inputmode="decimal"
				value={fixedValue}
				oninput={(event) => {
					const value = Number.parseFloat(
						(event.currentTarget as HTMLInputElement).value.replace(',', '.')
					);
					onFixedChange(Number.isNaN(value) ? 0 : value);
				}}
				placeholder="0.00"
				class="w-full h-12 border-thick border-primary rounded-md p-0 pl-14 font-mono font-bold text-2xl bg-surface-light"
			/>
		</div>
	</div>
</section>
