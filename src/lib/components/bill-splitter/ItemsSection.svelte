<script lang="ts">
	import type { BillItem, I18n, Person } from './types';

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
</script>

<section class="card">
	<div class="head">
		<span class="step">{t.step2}</span>
		<h2>{t.what}</h2>
	</div>

	<div class="add-row">
		<input
			bind:value={itemName}
			onkeydown={(e) => e.key === 'Enter' && submit()}
			placeholder={t.itemPh}
		/>
		<div class="price-wrap">
			<span>{currencySymbol}</span>
			<input
				bind:value={itemPrice}
				inputmode="decimal"
				onkeydown={(e) => e.key === 'Enter' && submit()}
				placeholder="0.00"
			/>
		</div>
		<button type="button" class="plus" onclick={submit}>+</button>
	</div>

	{#if items.length}
		<div class="items">
			{#each items as item (item.id)}
				<div class="item-card">
					<div class="item-head">
						<div>
							<div class="item-title">{item.name}</div>
							<div class="item-sub">{eachLabel(item)}</div>
						</div>
						<div class="item-right">
							<span>{money(item.price)}</span>
							<button type="button" onclick={() => onRemove({ id: item.id })}>x</button>
						</div>
					</div>
					<div class="assignments">
						<button type="button" onclick={() => onSplitAll({ itemId: item.id })}
							>{t.everyone}</button
						>
						{#each people as person (person.id)}
							<button
								type="button"
								class:item-active={item.assigned.includes(person.id)}
								onclick={() => onToggleAssign({ itemId: item.id, personId: person.id })}
							>
								{person.name}
							</button>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="empty">{people.length ? t.noItems : t.addFriendsFirst}</div>
	{/if}
</section>

<style>
	.card {
		background: #fff;
		border: 2.5px solid #211e1a;
		border-radius: 22px;
		box-shadow: 4px 4px 0 #211e1a;
		padding: 17px;
	}
	.head {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 12px;
	}
	.step {
		font:
			800 12px 'Bricolage Grotesque',
			system-ui;
		letter-spacing: 0.02em;
		color: #fff;
		background: #211e1a;
		padding: 3px 9px;
		border-radius: 7px;
	}
	h2 {
		margin: 0;
		font-size: 14px;
		font-weight: 700;
		color: #3a332a;
	}
	.add-row {
		display: grid;
		grid-template-columns: 1.5fr 1fr auto;
		gap: 9px;
	}
	input {
		height: 48px;
		border: 2.5px solid #211e1a;
		border-radius: 12px;
		padding: 0 14px;
		font-size: 15.5px;
		font-weight: 600;
		background: #fffdf8;
	}
	.price-wrap {
		position: relative;
	}
	.price-wrap span {
		position: absolute;
		left: 13px;
		top: 50%;
		transform: translateY(-50%);
		font-size: 15px;
		font-weight: 700;
		color: #b3a892;
	}
	.price-wrap input {
		width: 100%;
		padding-left: 44px;
	}
	.plus {
		width: 48px;
		height: 48px;
		border: 2.5px solid #211e1a;
		border-radius: 12px;
		background: var(--accent, #ff6a3d);
		font-size: 26px;
		font-weight: 700;
		cursor: pointer;
	}
	.items {
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-top: 15px;
	}
	.item-card {
		border: 2.5px solid #211e1a;
		background: #fffdf8;
		border-radius: 17px;
		padding: 14px;
		box-shadow: 2px 2px 0 #211e1a;
	}
	.item-head {
		display: flex;
		justify-content: space-between;
		gap: 12px;
	}
	.item-title {
		font:
			700 16.5px 'Bricolage Grotesque',
			system-ui;
	}
	.item-sub {
		font-size: 12.5px;
		font-weight: 700;
		color: #9a917f;
		margin-top: 3px;
	}
	.item-right {
		display: flex;
		align-items: center;
		gap: 8px;
		font:
			700 16px 'Space Mono',
			monospace;
	}
	.item-right button {
		width: 26px;
		height: 26px;
		border: 2px solid #211e1a;
		border-radius: 8px;
		background: #fff;
		cursor: pointer;
	}
	.assignments {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 13px;
	}
	.assignments button {
		padding: 7px 14px;
		border-radius: 999px;
		font:
			700 13px 'Bricolage Grotesque',
			system-ui;
		cursor: pointer;
		border: 2px solid #cfc4ae;
		background: #fff;
		color: #9a917f;
	}
	.assignments .item-active {
		border-color: #211e1a;
		background: #211e1a;
		color: #fff;
	}
	.empty {
		margin-top: 14px;
		padding: 20px 15px;
		border-radius: 15px;
		background: #fbf4e7;
		border: 2px dashed #e0d4bd;
		text-align: center;
		font-size: 14px;
		font-weight: 700;
		color: #56503f;
	}
	@media (max-width: 640px) {
		.add-row {
			grid-template-columns: 1fr;
		}
		.plus {
			width: 100%;
		}
	}
</style>
