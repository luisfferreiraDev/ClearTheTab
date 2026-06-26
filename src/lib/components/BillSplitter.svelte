<script lang="ts">
	import { onMount } from 'svelte';
	import HeaderBar from './bill-splitter/HeaderBar.svelte';
	import ItemsSection from './bill-splitter/ItemsSection.svelte';
	import PeopleSection from './bill-splitter/PeopleSection.svelte';
	import ReceiptTray from './bill-splitter/ReceiptTray.svelte';
	import SettingsModal from './bill-splitter/SettingsModal.svelte';
	import { ACCENTS, CURRENCIES, CURRENCY_SYMBOL, PALETTE, STR } from './bill-splitter/constants';
	import type { BillItem, Lang, Person, PersonShare, Transfer } from './bill-splitter/types';

	let people = $state<Person[]>([]);
	let items = $state<BillItem[]>([]);
	let tip = $state(0);
	let fixed = $state(0);
	let copied = $state<'' | 'copy' | 'share'>('');
	let copiedTimeout: ReturnType<typeof setTimeout> | null = null;
	let trayOpen = $state(false);
	let settingsOpen = $state(false);
	let lang = $state<Lang>('en');
	let currency = $state<(typeof CURRENCIES)[number]>('EUR');
	let payers = $state<string[]>([]);
	let accent = $state<keyof typeof ACCENTS>('Tangerine');

	const uid = (): string => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
	const t = (): (typeof STR)[Lang] => STR[lang] ?? STR.en;
	const cur = (): string => CURRENCY_SYMBOL[currency];
	const m = (v: number): string => `${cur()}${(Math.round((v + Number.EPSILON) * 100) / 100).toFixed(2)}`;

	function pickColor(): string {
		const used = new Set(people.map((person) => person.color));
		for (const color of PALETTE) {
			if (!used.has(color)) return color;
		}
		return PALETTE[people.length % PALETTE.length];
	}

	function addPerson(name: string): void {
		people = [...people, { id: uid(), name, color: pickColor() }];
	}

	function removePerson(id: string): void {
		people = people.filter((person) => person.id !== id);
		items = items.map((item) => ({ ...item, assigned: item.assigned.filter((assignedId) => assignedId !== id) }));
		payers = payers.filter((payer) => payer !== id);
	}

	function addItem(name: string, price: number): void {
		items = [...items, { id: uid(), name, price, assigned: people.map((person) => person.id) }];
	}

	function removeItem(id: string): void {
		items = items.filter((item) => item.id !== id);
	}

	function toggleAssign(itemId: string, personId: string): void {
		items = items.map((item) => {
			if (item.id !== itemId) return item;
			const active = item.assigned.includes(personId);
			return { ...item, assigned: active ? item.assigned.filter((id) => id !== personId) : [...item.assigned, personId] };
		});
	}

	function splitAll(itemId: string): void {
		items = items.map((item) => {
			if (item.id !== itemId) return item;
			const allIds = people.map((person) => person.id);
			const allOn = allIds.length > 0 && allIds.every((id) => item.assigned.includes(id));
			return { ...item, assigned: allOn ? [] : allIds };
		});
	}

	function togglePayer(id: string): void {
		payers = payers.includes(id) ? payers.filter((payer) => payer !== id) : [...payers, id];
	}

	function compute(): { perPerson: PersonShare[]; grand: number; itemsSubtotal: number; n: number } {
		const n = people.length;
		const owe: Record<string, number> = {};
		for (const person of people) owe[person.id] = 0;

		for (const item of items) {
			const valid = item.assigned.filter((id) => people.some((person) => person.id === id));
			if (valid.length > 0 && item.price > 0) {
				const each = item.price / valid.length;
				for (const id of valid) owe[id] += each;
			}
		}

		const fixedEach = n > 0 ? fixed / n : 0;
		const perPerson: PersonShare[] = people.map((person) => {
			const base = owe[person.id] || 0;
			const tipShare = base * (tip / 100);
			return { ...person, base, total: base + tipShare + fixedEach };
		});
		const itemsSubtotal = items.reduce((sum, item) => sum + (item.price || 0), 0);
		const grand = itemsSubtotal * (1 + tip / 100) + (n > 0 ? fixed : 0);
		return { perPerson, grand, itemsSubtotal, n };
	}

	function settlement(): { payerIds: string[]; transfers: Transfer[] } {
		const { perPerson, grand, n } = compute();
		const payerIds = payers.filter((id) => people.some((person) => person.id === id));
		if (!payerIds.length || n === 0) return { payerIds, transfers: [] };

		const paidEach = grand / payerIds.length;
		const shareOf: Record<string, number> = {};
		for (const person of perPerson) shareOf[person.id] = person.total;

		const net: Record<string, number> = {};
		for (const person of people) {
			net[person.id] = (shareOf[person.id] || 0) - (payerIds.includes(person.id) ? paidEach : 0);
		}

		const debt = people
			.filter((person) => net[person.id] > 0.005)
			.map((person) => ({ person, amount: net[person.id] }))
			.sort((a, b) => b.amount - a.amount);
		const credit = people
			.filter((person) => net[person.id] < -0.005)
			.map((person) => ({ person, amount: -net[person.id] }))
			.sort((a, b) => b.amount - a.amount);

		const transfers: Transfer[] = [];
		let i = 0;
		let j = 0;
		while (i < debt.length && j < credit.length) {
			const amount = Math.min(debt[i].amount, credit[j].amount);
			if (amount > 0.005) {
				transfers.push({
					from: debt[i].person,
					to: credit[j].person,
					amount: Math.round(amount * 100) / 100
				});
			}
			debt[i].amount -= amount;
			credit[j].amount -= amount;
			if (debt[i].amount <= 0.005) i += 1;
			if (credit[j].amount <= 0.005) j += 1;
		}
		return { payerIds, transfers };
	}

	function encodeState(): string {
		const data = {
			people,
			items: items.map((item) => ({ id: item.id, name: item.name, price: item.price, assigned: item.assigned })),
			tip,
			fixed,
			lang,
			currency,
			payers,
			accent
		};
		return encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(data)))));
	}

	function decodeState(encoded: string): void {
		try {
			const json = decodeURIComponent(escape(atob(decodeURIComponent(encoded))));
			const parsed = JSON.parse(json) as {
				people?: Person[];
				items?: BillItem[];
				tip?: number;
				fixed?: number;
				lang?: Lang;
				currency?: (typeof CURRENCIES)[number];
				payers?: string[];
				accent?: keyof typeof ACCENTS;
			};
			if (Array.isArray(parsed.people)) people = parsed.people;
			if (Array.isArray(parsed.items)) items = parsed.items;
			if (typeof parsed.tip === 'number') tip = parsed.tip;
			if (typeof parsed.fixed === 'number') fixed = parsed.fixed;
			if (parsed.lang) lang = parsed.lang;
			if (parsed.currency) currency = parsed.currency;
			if (Array.isArray(parsed.payers)) payers = parsed.payers;
			if (parsed.accent) accent = parsed.accent;
		} catch {
			// Ignore malformed state in hash.
		}
	}

	async function copyToClipboard(text: string): Promise<void> {
		try {
			if (navigator.clipboard?.writeText) {
				await navigator.clipboard.writeText(text);
				return;
			}
		} catch {
			// Fall through to textarea fallback.
		}
		const ta = document.createElement('textarea');
		ta.value = text;
		ta.style.position = 'fixed';
		ta.style.opacity = '0';
		document.body.appendChild(ta);
		ta.select();
		document.execCommand('copy');
		document.body.removeChild(ta);
	}

	function flash(key: 'copy' | 'share'): void {
		copied = key;
		if (copiedTimeout) clearTimeout(copiedTimeout);
		copiedTimeout = setTimeout(() => {
			copied = '';
		}, 1800);
	}

	function buildText(): string {
		const i18n = t();
		const { perPerson, grand } = compute();
		const { payerIds, transfers } = settlement();
		const lines: string[] = [];
		lines.push(`Bill split - ${i18n.billHead}`);
		lines.push('');
		if (payerIds.length && transfers.length) {
			for (const tr of transfers) lines.push(`${tr.from.name} -> ${i18n.payVerb} ${tr.to.name}: ${m(tr.amount)}`);
		} else if (payerIds.length) {
			lines.push(i18n.allSettled);
		} else {
			for (const person of [...perPerson].sort((a, b) => b.total - a.total)) {
				lines.push(`${person.name} - ${m(person.total)}`);
			}
		}
		lines.push('');
		lines.push(`${i18n.totalWord}: ${m(grand)}`);
		return lines.join('\n');
	}

	function onCopy(): void {
		void copyToClipboard(buildText());
		flash('copy');
	}

	function onShare(): void {
		const url = `${location.origin}${location.pathname}#d=${encodeState()}`;
		history.replaceState(null, '', url);
		void copyToClipboard(url);
		flash('share');
	}

	onMount(() => {
		const hash = location.hash || '';
		const match = hash.match(/[#&]d=([^&]+)/);
		if (match) decodeState(match[1]);
	});

	const calc = $derived(compute());
	const perPerson = $derived(calc.perPerson as PersonShare[]);
	const grand = $derived(calc.grand);
	const itemsSubtotal = $derived(calc.itemsSubtotal);
	const n = $derived(calc.n);

	const settle = $derived(settlement());
	const payerIds = $derived(settle.payerIds as string[]);
	const transfers = $derived(settle.transfers as Transfer[]);

	const tipAmount = $derived(itemsSubtotal * (tip / 100));
	const tallyEnabled = $derived(n > 0 && items.length > 0);
	const receiptMeta = $derived(`${n} ${n === 1 ? 'guest' : 'guests'} - ${items.length} ${items.length === 1 ? 'item' : 'items'}`);
	const payerNames = $derived(
		payerIds.map((id) => people.find((person) => person.id === id)?.name).filter((value): value is string => Boolean(value))
	);
	const currentAccent = $derived(ACCENTS[accent]);
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=Space+Mono:wght@400;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="backdrop" />

<main class="screen" style={`--accent:${currentAccent}`}>
	<div class="shell">
		<HeaderBar t={t()} accent={currentAccent} on:settings={() => (settingsOpen = true)} />
		<PeopleSection t={t()} {people} on:add={(e) => addPerson(e.detail.name)} on:remove={(e) => removePerson(e.detail.id)} />
		<ItemsSection
			t={t()}
			{people}
			{items}
			currencySymbol={cur()}
			on:add={(e) => addItem(e.detail.name, e.detail.price)}
			on:remove={(e) => removeItem(e.detail.id)}
			on:toggleAssign={(e) => toggleAssign(e.detail.itemId, e.detail.personId)}
			on:splitAll={(e) => splitAll(e.detail.itemId)}
		/>
		<section class="card adjust">
			<div class="head-row">
				<div class="label">{t().tipService}</div>
				<div class="amount">{tip === 0 ? t().none : `+${m(tipAmount)}`}</div>
			</div>
			<div class="tip-grid">
				{#each [0, 5, 10, 15] as option}
					<button type="button" class:active={tip === option} on:click={() => (tip = option)}>{option}%</button>
				{/each}
			</div>
			<div class="divider" />
			<div class="fixed-row">
				<div>
					<div class="sub-title">{t().sharedExtra}</div>
					<div class="sub-note">{t().sharedExtraSub}</div>
				</div>
				<div class="money-input">
					<span>{cur()}</span>
					<input
						type="text"
						inputmode="decimal"
						value={fixed ? fixed.toString() : ''}
						on:input={(event) => {
							const value = Number.parseFloat((event.currentTarget as HTMLInputElement).value.replace(',', '.'));
							fixed = Number.isNaN(value) ? 0 : value;
						}}
						placeholder="0.00"
					/>
				</div>
			</div>
		</section>
		<section class="card">
			<div class="head">
				<span class="step">{t().step3}</span>
				<h2>{t().whoPaid}</h2>
			</div>
			<p class="muted">{t().whoPaidSub}</p>
			{#if people.length}
				<div class="payer-row">
					{#each people as person (person.id)}
						<button type="button" class:payer-active={payers.includes(person.id)} on:click={() => togglePayer(person.id)}>
							{person.name}
						</button>
					{/each}
				</div>
			{:else}
				<div class="empty-state">{t().payerEmptyPeople}</div>
			{/if}
		</section>
		<div class="sticky">
			<div class="tally-bar">
				<div class="totals">
					<div>{t().billTotal}</div>
					<strong>{m(grand)}</strong>
				</div>
				<button type="button" class:tally-disabled={!tallyEnabled} on:click={() => tallyEnabled && (trayOpen = true)}>
					{tallyEnabled ? t().tally : t().addPeopleItems}
				</button>
			</div>
		</div>
	</div>
</main>

<ReceiptTray
	open={trayOpen}
	t={t()}
	canSettle={tallyEnabled}
	{receiptMeta}
	paidByLine={`${t().paidBy} ${payerNames.join(', ').toUpperCase()}`}
	showPaidBy={payerIds.length > 0}
	{transfers}
	shares={perPerson}
	subtotalLabel={m(itemsSubtotal)}
	tipLabel={m(tipAmount)}
	showTip={tip > 0}
	extraLabel={m(n > 0 ? fixed : 0)}
	showExtra={fixed > 0}
	grandLabel={m(grand)}
	copyLabel={copied === 'copy' ? t().copied : t().copyText}
	shareLabel={copied === 'share' ? t().linkCopied : t().shareLink}
	on:close={() => (trayOpen = false)}
	on:copy={onCopy}
	on:share={onShare}
/>

<SettingsModal
	open={settingsOpen}
	t={t()}
	{lang}
	{currency}
	on:close={() => (settingsOpen = false)}
	on:lang={(e) => (lang = e.detail.value)}
	on:currency={(e) => (currency = e.detail.value)}
/>

<style>
	:global(body) {
		margin: 0;
		background: #fbf1e2;
		font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', system-ui, sans-serif;
		-webkit-font-smoothing: antialiased;
	}
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 0;
		overflow: hidden;
		pointer-events: none;
		background:
			radial-gradient(40% 32% at 92% -3%, rgba(255, 217, 168, 0.65) 0%, transparent 70%),
			radial-gradient(42% 30% at 1% 96%, rgba(199, 231, 212, 0.55) 0%, transparent 70%),
			radial-gradient(31% 22% at 60% 42%, rgba(255, 199, 192, 0.45) 0%, transparent 70%);
	}
	.screen {
		position: relative;
		z-index: 1;
		min-height: 100vh;
		display: flex;
		justify-content: center;
		padding: 26px 16px;
	}
	.shell {
		width: 100%;
		max-width: 452px;
		display: flex;
		flex-direction: column;
		gap: 15px;
	}
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
		margin-bottom: 4px;
	}
	.step {
		font: 800 12px 'Bricolage Grotesque', system-ui;
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
	.muted {
		font-size: 12px;
		color: #9a917f;
		font-weight: 600;
		margin: 0 0 12px;
	}
	.adjust {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	.head-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.label {
		font: 800 12px 'Bricolage Grotesque', system-ui;
		letter-spacing: 0.02em;
		color: #8a7e6a;
	}
	.amount {
		font: 700 13px 'Space Mono', monospace;
		color: #1e9e6a;
	}
	.tip-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 8px;
	}
	.tip-grid button {
		height: 46px;
		border-radius: 13px;
		font: 700 14.5px 'Space Mono', monospace;
		cursor: pointer;
		border: 2.5px solid #cfc4ae;
		background: #fff;
		color: #9a917f;
	}
	.tip-grid .active {
		border-color: #211e1a;
		background: #211e1a;
		color: #fff;
	}
	.divider {
		height: 2px;
		background: repeating-linear-gradient(90deg, #e0d4bd 0 7px, transparent 7px 13px);
	}
	.fixed-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 14px;
	}
	.sub-title {
		font-size: 14px;
		font-weight: 700;
		color: #3a332a;
	}
	.sub-note {
		font-size: 12px;
		color: #9a917f;
		font-weight: 600;
	}
	.money-input {
		position: relative;
		width: 140px;
		flex-shrink: 0;
	}
	.money-input span {
		position: absolute;
		left: 13px;
		top: 50%;
		transform: translateY(-50%);
		font-size: 15px;
		font-weight: 700;
		color: #b3a892;
	}
	.money-input input {
		width: 100%;
		height: 46px;
		border: 2.5px solid #211e1a;
		border-radius: 13px;
		padding: 0 13px 0 52px;
		font: 700 15px 'Space Mono', monospace;
		background: #fffdf8;
	}
	.payer-row {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.payer-row button {
		padding: 7px 14px;
		border-radius: 999px;
		font: 700 13px 'Bricolage Grotesque', system-ui;
		cursor: pointer;
		border: 2px solid #cfc4ae;
		background: #fff;
		color: #9a917f;
	}
	.payer-row .payer-active {
		border-color: #211e1a;
		background: #211e1a;
		color: #fff;
	}
	.empty-state {
		padding: 14px 15px;
		border-radius: 14px;
		background: #fbf4e7;
		border: 2px dashed #e0d4bd;
		font-size: 13px;
		color: #8a7e6a;
		font-weight: 600;
	}
	.sticky {
		position: sticky;
		bottom: 14px;
		z-index: 6;
	}
	.tally-bar {
		display: flex;
		align-items: center;
		gap: 12px;
		background: #211e1a;
		border: 2.5px solid #211e1a;
		border-radius: 20px;
		padding: 11px 12px 11px 18px;
	}
	.totals {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 1px;
	}
	.totals div {
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.06em;
		color: #9a8f7c;
	}
	.totals strong {
		font: 700 22px 'Space Mono', monospace;
		color: #fff;
	}
	.tally-bar button {
		height: 50px;
		padding: 0 20px;
		border: 2.5px solid #fffdf8;
		border-radius: 14px;
		background: var(--accent, #ff6a3d);
		color: #211e1a;
		font: 800 15.5px 'Bricolage Grotesque', system-ui;
		cursor: pointer;
	}
	.tally-bar .tally-disabled {
		border-color: #3a352c;
		background: transparent;
		color: #6e6553;
		cursor: default;
	}
	@media (max-width: 640px) {
		.screen {
			padding: 18px 12px;
		}
		.fixed-row {
			flex-direction: column;
			align-items: stretch;
		}
		.money-input {
			width: 100%;
		}
		.tip-grid {
			grid-template-columns: repeat(2, 1fr);
		}
		.tally-bar {
			flex-direction: column;
			align-items: stretch;
		}
		.tally-bar button {
			width: 100%;
		}
	}
</style>
