<script lang="ts">
	import type { I18n } from './types';

	let {
		t,
		tip = 0,
		tipAmountLabel = '',
		currencySymbol = '',
		fixedValue = '',
		onTipChange = () => {},
		onFixedChange = () => {}
	}: {
		t: I18n;
		tip?: number;
		tipAmountLabel?: string;
		currencySymbol?: string;
		fixedValue?: string;
		onTipChange?: (value: number) => void;
		onFixedChange?: (value: number) => void;
	} = $props();
</script>

<section class="bg-white border-thick border-primary rounded-3xl shadow-lg p-4 flex flex-col gap-4">
	<div class="flex items-center justify-between gap-2">
		<div class="text-muted text-xs font-bricolage font-extrabold tracking-xs">
			{t.tipService}
		</div>
		<div class="text-success text-lg-0.5 font-mono font-bold">
			{tip === 0 ? t.none : `+${tipAmountLabel}`}
		</div>
	</div>
	<div class="grid md:grid-cols-4 gap-2 grid-cols-2">
		{#each [0, 5, 10, 15] as option}
			{@const isSelected = tip === option}
			<button
				type="button"
				class="px-4 border-2 h-12 rounded-sm transition-all font-mono font-bold cursor-pointer text-2xl-0.5 {isSelected
					? ' bg-black text-white shadow-accent shadow-sm border-black'
					: '  text-muted-light border-muted-light'}"
				onclick={() => onTipChange(option)}>{option}%</button
			>
		{/each}
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
