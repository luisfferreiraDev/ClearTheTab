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
	const m = (v: number): string =>
		`${cur()}${(Math.round((v + Number.EPSILON) * 100) / 100).toFixed(2)}`;

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
		items = items.map((item) => ({
			...item,
			assigned: item.assigned.filter((assignedId) => assignedId !== id)
		}));
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
			return {
				...item,
				assigned: active
					? item.assigned.filter((id) => id !== personId)
					: [...item.assigned, personId]
			};
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

	function compute(): {
		perPerson: PersonShare[];
		grand: number;
		itemsSubtotal: number;
		n: number;
	} {
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
			items: items.map((item) => ({
				id: item.id,
				name: item.name,
				price: item.price,
				assigned: item.assigned
			})),
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
			for (const tr of transfers)
				lines.push(`${tr.from.name} -> ${i18n.payVerb} ${tr.to.name}: ${m(tr.amount)}`);
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
	const receiptMeta = $derived(
		`${n} ${n === 1 ? 'guest' : 'guests'} - ${items.length} ${items.length === 1 ? 'item' : 'items'}`
	);
	const payerNames = $derived(
		payerIds
			.map((id) => people.find((person) => person.id === id)?.name)
			.filter((value): value is string => Boolean(value))
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

<div
	class="fixed inset-0 z-0 overflow-hidden pointer-events-none"
	style="background-image: radial-gradient(40% 32% at 92% -3%, rgba(255, 217, 168, 0.65) 0%, transparent 70%), radial-gradient(42% 30% at 1% 96%, rgba(199, 231, 212, 0.55) 0%, transparent 70%), radial-gradient(31% 22% at 60% 42%, rgba(255, 199, 192, 0.45) 0%, transparent 70%)"
></div>

<main class="relative z-1 min-h-screen flex justify-center px-4 py-7 md:py-5 md:px-3">
	<div class="w-full max-w-md flex flex-col gap-6">
		<HeaderBar t={t()} accent={currentAccent} onSettings={() => (settingsOpen = true)} />
		<PeopleSection
			t={t()}
			{people}
			onAdd={({ name }) => addPerson(name)}
			onRemove={({ id }) => removePerson(id)}
		/>
		<ItemsSection
			t={t()}
			{people}
			{items}
			currencySymbol={cur()}
			onAdd={({ name, price }) => addItem(name, price)}
			onRemove={({ id }) => removeItem(id)}
			onToggleAssign={({ itemId, personId }) => toggleAssign(itemId, personId)}
			onSplitAll={({ itemId }) => splitAll(itemId)}
		/>
		<section class="bg-white border-thick border-primary rounded-3xl shadow-lg p-4">
			<div class="head-row">
				<div class="text-muted text-xs font-bricolage font-extrabold tracking-xs">
					{t().tipService}
				</div>
				<div class="text-success text-lg-0.5 font-mono font-bold">
					{tip === 0 ? t().none : `+${m(tipAmount)}`}
				</div>
			</div>
			<div class="grid grid-cols-4 gap-2 md:grid-cols-2">
				{#each [0, 5, 10, 15] as option}
					<button
						type="button"
						class:border-primary={tip === option}
						class:bg-primary={tip === option}
						class:text-white={tip === option}
						class="h-12 rounded-md font-mono font-bold cursor-pointer border-thick border-border-light bg-white text-muted-light"
						onclick={() => (tip = option)}>{option}%</button
					>
				{/each}
			</div>
			<div
				class="h-0.5 bg-repeat-x"
				style="background-image: repeating-linear-gradient(90deg, #e0d4bd 0 7px, transparent 7px 13px)"
			></div>
			<div class="flex justify-between items-center gap-lg md:flex-col md:items-stretch">
				<div>
					<div class="text-xl font-bold text-primary-light">{t().sharedExtra}</div>
					<div class="text-xs text-muted font-bold">{t().sharedExtraSub}</div>
				</div>
				<div class="relative w-35 shrink-0 md:w-full">
					<span
						class="absolute left-3 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-lighter"
						>{cur()}</span
					>
					<input
						type="text"
						inputmode="decimal"
						value={fixed ? fixed.toString() : ''}
						oninput={(event) => {
							const value = Number.parseFloat(
								(event.currentTarget as HTMLInputElement).value.replace(',', '.')
							);
							fixed = Number.isNaN(value) ? 0 : value;
						}}
						placeholder="0.00"
						class="w-full h-12 border-thick border-primary rounded-md p-0 pl-14 font-mono font-bold text-2xl bg-surface-light"
					/>
				</div>
			</div>
		</section>
		<section class="bg-white border-thick border-primary rounded-3xl shadow-lg p-4">
			<div class="flex items-center gap-2 mb-1">
				<span
					class="text-xs font-bricolage font-extrabold tracking-xs text-white bg-primary px-2 py-0.5 rounded-xs"
					>{t().step3}</span
				>
				<h2 class="m-0 text-xl font-bold text-primary-light">{t().whoPaid}</h2>
			</div>
			<p class="text-xs text-muted font-bold m-0 mb-3">{t().whoPaidSub}</p>
			{#if people.length}
				<div class="flex flex-wrap gap-2">
					{#each people as person (person.id)}
						<button
							type="button"
							class:border-primary={payers.includes(person.id)}
							class:bg-primary={payers.includes(person.id)}
							class:text-white={payers.includes(person.id)}
							class="px-4 py-2 rounded-full font-bricolage font-bold cursor-pointer border-thick border-border-light bg-white text-muted-light text-lg"
							onclick={() => togglePayer(person.id)}
						>
							{person.name}
						</button>
					{/each}
				</div>
			{:else}
				<div
					class="p-4 rounded-lg bg-empty-bg border-2 border-dashed border-border-lighter text-xs text-muted font-bold"
				>
					{t().payerEmptyPeople}
				</div>
			{/if}
		</section>
		<div class="sticky bottom-3 z-50">
			<div
				class="flex items-center gap-3 bg-primary border-thick border-primary rounded-2xl p-3 md:flex-col md:items-stretch"
			>
				<div class="flex-1 flex flex-col gap-0.5">
					<div class="text-xs font-bold tracking-md text-muted-light">{t().billTotal}</div>
					<strong class="font-mono text-5xl font-bold text-white">{m(grand)}</strong>
				</div>
				<button
					type="button"
					class:border-primary={!tallyEnabled}
					class:bg-transparent={!tallyEnabled}
					class:text-muted={!tallyEnabled}
					class:cursor-default={!tallyEnabled}
					class="h-12 px-5 border-thick border-surface-light rounded-lg text-primary font-bricolage font-extrabold text-2xl-0.5 cursor-pointer md:w-full"
					style={`background-color: ${tallyEnabled ? 'var(--accent, #ff6a3d)' : 'transparent'}`}
					onclick={() => tallyEnabled && (trayOpen = true)}
				>
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
	onClose={() => (trayOpen = false)}
	{onCopy}
	{onShare}
/>

<SettingsModal
	open={settingsOpen}
	t={t()}
	{lang}
	{currency}
	onClose={() => (settingsOpen = false)}
	onLang={(value: Lang) => (lang = value)}
	onCurrency={(value: (typeof CURRENCIES)[number]) => (currency = value)}
/>
