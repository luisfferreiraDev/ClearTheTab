<script lang="ts">
	import type { BillItem, I18n, Person } from './types';
	import ReceiptScanner from './ReceiptScanner.svelte';

	let {
		t,
		people = [],
		items = [],
		currencySymbol = 'EUR ',
		onAdd = () => {},
		onRemove = () => {},
		onToggleAssign = () => {},
		onSplitAll = () => {}
	}: {
		t: I18n;
		people?: Person[];
		items?: BillItem[];
		currencySymbol?: string;
		onAdd?: (payload: { name: string; price: number }) => void;
		onRemove?: (payload: { id: string }) => void;
		onToggleAssign?: (payload: { itemId: string; personId: string }) => void;
		onSplitAll?: (payload: { itemId: string }) => void;
	} = $props();

	let itemName = $state('');
	let itemPrice = $state('');

	function submit(): void {
		const name = itemName.trim();
		const price = Number.parseFloat(itemPrice.replace(',', '.'));
		if (!name || !(price > 0)) return;
		onAdd({ name, price });
		itemName = '';
		itemPrice = '';
	}

	function eachLabel(item: BillItem): string {
		const valid = item.assigned.filter((id) => people.some((p) => p.id === id));
		const count = valid.length;
		if (!people.length) return t.addToSplit;
		if (!count) return t.tapWho;
		const each = item.price / count;
		return `${currencySymbol}${each.toFixed(2)} ${t.eachWord} - ${count} ${count === 1 ? t.person : t.people}`;
	}

	function money(value: number): string {
		return `${currencySymbol}${value.toFixed(2)}`;
	}

	function isEveryoneAssigned(item: BillItem): boolean {
		if (!people.length) return false;
		const allIds = people.map((person) => person.id);
		return allIds.every((id) => item.assigned.includes(id));
	}
</script>

<section class="bg-white border-thick border-primary rounded-3xl shadow-lg p-4">
	<div class="flex items-center gap-2 mb-3">
		<span
			class="text-xs font-bricolage font-extrabold tracking-xs text-white bg-primary px-2 py-0.5 rounded-xs"
			>{t.step2}</span
		>
		<h2 class="m-0 text-xl font-bold text-primary-light">{t.what}</h2>
	</div>

	<div class="grid md:grid-cols-[1.5fr_1fr_auto] gap-4 grid-cols-1">
		<input
			bind:value={itemName}
			onkeydown={(e) => e.key === 'Enter' && submit()}
			placeholder={t.itemPh}
			class="h-12 border-thick border-primary rounded-sm p-0 px-4 text-2xl-0.5 font-bold bg-surface-light"
		/>
		<div class="relative">
			<span class="absolute left-3 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-lighter"
				>{currencySymbol}</span
			>
			<input
				bind:value={itemPrice}
				inputmode="decimal"
				onkeydown={(e) => e.key === 'Enter' && submit()}
				placeholder="0.00"
				class="w-full h-12 border-thick border-primary rounded-sm p-0 pl-12 text-2xl-0.5 font-bold bg-surface-light"
			/>
		</div>
		<div class="flex gap-2">
			<ReceiptScanner {t} {currencySymbol} {onAdd} />
			<button
				type="button"
				class="flex-1 md:w-12 md:flex-none h-12 border-thick border-primary rounded-sm text-3xl font-bold cursor-pointer shrink-0"
				style={`background-color: var(--accent, #ff6a3d)`}
				onclick={submit}>+</button
			>
		</div>
	</div>

	{#if items.length}
		<div class="flex flex-col gap-3 mt-4">
			{#each items as item (item.id)}
				<div class="border-thick border-primary bg-surface-light rounded-2xl p-4 shadow-sm">
					<div class="flex justify-between items-start gap-3">
						<div>
							<div class="font-bricolage font-bold text-2xl-0.5">{item.name}</div>
							<div class="text-md font-bold text-muted-light mt-0.5">{eachLabel(item)}</div>
						</div>
						<div class="flex items-center gap-2 font-mono font-bold text-2xl">
							<span>{money(item.price)}</span>
							<button
								type="button"
								class="w-6 h-6 border-2 border-primary rounded-sm bg-white cursor-pointer"
								onclick={() => onRemove({ id: item.id })}>x</button
							>
						</div>
					</div>
					<div class="flex flex-wrap gap-2 mt-3">
						<button
							type="button"
							class="px-4 border-2 py-2 rounded-full transition-all font-bricolage font-bold cursor-pointer text-lg {isEveryoneAssigned(
								item
							)
								? ' bg-black text-white shadow-accent shadow-sm border-black'
								: '  text-muted-light border-muted-light'}"
							onclick={() => onSplitAll({ itemId: item.id })}>{t.everyone}</button
						>
						{#each people as person (person.id)}
							{@const assigned = item.assigned.includes(person.id)}
							<button
								type="button"
								class="px-4 pl-2 py-2 flex items-center border-2 transition-all gap-2 rounded-full font-bricolage font-bold cursor-pointer text-lg {assigned
									? `shadow-sm text-white  border-black`
									: ' text-muted-light  border-muted-light'}"
								style={assigned ? `background-color: ${person.color}` : ''}
								onclick={() => onToggleAssign({ itemId: item.id, personId: person.id })}
							>
								<span
									class="{assigned
										? ''
										: ' opacity-70'} w-5 h-5 grid place-items-center rounded-full text-xs font-extrabold text-white border border-primary"
									style={`background:${person.color}`}>{person.name[0]?.toUpperCase() ?? '?'}</span
								>
								{person.name}
							</button>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div
			class="mt-3 p-5 rounded-xl bg-empty-bg border-2 border-dashed border-border-lighter text-center text-xl font-bold text-primary-light"
		>
			{people.length ? t.noItems : t.addFriendsFirst}
		</div>
	{/if}
</section>
