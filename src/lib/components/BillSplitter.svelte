<script lang="ts">
	import { onMount } from 'svelte';
	import HeaderBar from './bill-splitter/HeaderBar.svelte';
	import ItemsSection from './bill-splitter/ItemsSection.svelte';
	import PeopleSection from './bill-splitter/PeopleSection.svelte';
	import ReceiptTray from './bill-splitter/ReceiptTray.svelte';
	import SettingsModal from './bill-splitter/SettingsModal.svelte';
	import TipServiceSection from './bill-splitter/TipServiceSection.svelte';
	import WhoPaidSection from './bill-splitter/WhoPaidSection.svelte';
	import { CURRENCIES, CURRENCY_SYMBOL, PALETTE, STR } from './bill-splitter/constants';
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
	let canInstall = $state(false);
	let installPrompt = $state<{ prompt: () => Promise<void> } | null>(null);
	let receiptTitle = $state('');
	let receiptDate = $state('');

	let initialized = false;
	const STORAGE_KEY = 'clear-the-tab-state';

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

	function resetTab(): void {
		people = [];
		items = [];
		tip = 0;
		fixed = 0;
		payers = [];
		receiptTitle = '';
		receiptDate = '';
		try {
			localStorage.removeItem(STORAGE_KEY);
		} catch {
			// Ignore storage errors.
		}
		settingsOpen = false;
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
			receiptTitle,
			receiptDate
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
				receiptTitle?: string;
				receiptDate?: string;
			};
			if (Array.isArray(parsed.people)) people = parsed.people;
			if (Array.isArray(parsed.items)) items = parsed.items;
			if (typeof parsed.tip === 'number') tip = parsed.tip;
			if (typeof parsed.fixed === 'number') fixed = parsed.fixed;
			if (parsed.lang) lang = parsed.lang;
			if (parsed.currency) currency = parsed.currency;
			if (Array.isArray(parsed.payers)) payers = parsed.payers;
			if (typeof parsed.receiptTitle === 'string') receiptTitle = parsed.receiptTitle;
			if (typeof parsed.receiptDate === 'string') receiptDate = parsed.receiptDate;
		} catch {
			// Ignore malformed state in hash.
		}
	}

	function saveToStorage(): void {
		try {
			localStorage.setItem(STORAGE_KEY, encodeState());
		} catch {
			// Ignore quota / private-browsing errors.
		}
	}

	function loadFromStorage(): void {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) decodeState(stored);
		} catch {
			// Ignore storage errors.
		}
	}

	$effect(() => {
		// Reference all reactive state to establish tracking on first run.
		people; items; tip; fixed; lang; currency; payers; receiptTitle; receiptDate;
		if (!initialized) return;
		saveToStorage();
	});

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

	async function generateReceiptImage(): Promise<Blob> {
		await document.fonts.ready;

		const W = 600;
		const DPR = 2;
		const PAD = 44;
		const ZH = 16;
		const TOOTH_W = 12;
		const CREAM = '#fef9ef';
		const DARK = '#211e1a';
		const MUTED = '#9a8e78';
		const LIGHT = '#b3a48e';
		const DASH_CLR = '#c8bca6';
		const GREEN = '#1e9e6a';

		const i18n = t();
		const { perPerson, grand, itemsSubtotal } = compute();
		const { payerIds, transfers } = settlement();
		const showPaidBy = payerIds.length > 0;
		const tipAmt = itemsSubtotal * (tip / 100);
		const payerNamesStr = payerIds
			.map((id) => people.find((p) => p.id === id)?.name)
			.filter((v): v is string => Boolean(v))
			.join(', ')
			.toUpperCase();
		const metaStr = `${n} ${n === 1 ? 'guest' : 'guests'} — ${items.length} ${items.length === 1 ? 'item' : 'items'}`;

		function paint(ctx: CanvasRenderingContext2D | null, H: number): number {
			// ── Background + paper body ──────────────────────────────────────
			if (ctx) {
				ctx.fillStyle = '#e8dfd3';
				ctx.fillRect(0, 0, W, H);
				ctx.fillStyle = CREAM;
				ctx.fillRect(0, ZH, W, H - ZH * 2);

				// Top zigzag — teeth point up
				const topTroughY = Math.round(ZH * 8 / 12);
				ctx.fillStyle = CREAM;
				ctx.beginPath();
				ctx.moveTo(0, topTroughY);
				for (let x = 0; x < W; x += TOOTH_W) {
					ctx.lineTo(x + TOOTH_W / 2, 0);
					ctx.lineTo(x + TOOTH_W, topTroughY);
				}
				ctx.lineTo(W, ZH);
				ctx.lineTo(0, ZH);
				ctx.closePath();
				ctx.fill();

				// Bottom zigzag — teeth point down
				const btY = H - ZH;
				const btTroughY = btY + Math.round(ZH * 4 / 12);
				ctx.fillStyle = CREAM;
				ctx.beginPath();
				ctx.moveTo(0, btY);
				ctx.lineTo(W, btY);
				ctx.lineTo(W, btTroughY);
				for (let x = W; x > 0; x -= TOOTH_W) {
					ctx.lineTo(x - TOOTH_W / 2, H);
					ctx.lineTo(x - TOOTH_W, btTroughY);
				}
				ctx.lineTo(0, btTroughY);
				ctx.closePath();
				ctx.fill();
			}

			// ── Text / line helpers ──────────────────────────────────────────
			const txt = (
				str: string,
				tx: number,
				ty: number,
				size: number,
				align: CanvasTextAlign,
				bold: boolean,
				color: string
			) => {
				if (!ctx) return;
				ctx.font = `${bold ? 'bold ' : ''}${size}px 'Space Mono', monospace`;
				ctx.fillStyle = color;
				ctx.textAlign = align;
				ctx.textBaseline = 'alphabetic';
				ctx.fillText(str, tx, ty);
			};

			const dashed = (ty: number) => {
				if (!ctx) return;
				ctx.save();
				ctx.strokeStyle = DASH_CLR;
				ctx.lineWidth = 1;
				ctx.setLineDash([4, 4]);
				ctx.beginPath();
				ctx.moveTo(PAD, ty);
				ctx.lineTo(W - PAD, ty);
				ctx.stroke();
				ctx.restore();
			};

			const solid = (ty: number) => {
				if (!ctx) return;
				ctx.save();
				ctx.strokeStyle = 'rgba(33,30,26,0.2)';
				ctx.lineWidth = 1.5;
				ctx.setLineDash([]);
				ctx.beginPath();
				ctx.moveTo(PAD, ty);
				ctx.lineTo(W - PAD, ty);
				ctx.stroke();
				ctx.restore();
			};

			// ── Layout ───────────────────────────────────────────────────────
			let y = ZH + 28;

			// Header
			y += 17;
			txt('CLEAR THE TAB', W / 2, y, 17, 'center', true, DARK);
			y += 8;
			y += 10;
			txt(i18n.tableReceipt.toUpperCase(), W / 2, y, 10, 'center', false, MUTED);
			y += 16;

			dashed(y);
			y += 16;

			// Optional receipt title & date
			if (receiptTitle) {
				y += 16;
				txt(receiptTitle, W / 2, y, 15, 'center', true, DARK);
				y += 8;
			}
			if (receiptDate) {
				const [yr, mo, dy] = receiptDate.split('-');
				const formatted = `${dy}/${mo}/${yr}`;
				y += 12;
				txt(formatted, W / 2, y, 11, 'center', false, MUTED);
				y += 8;
			}
			if (receiptTitle || receiptDate) {
				y += 8;
				dashed(y);
				y += 16;
			}

			// Meta
			y += 11;
			txt(metaStr, W / 2, y, 11, 'center', false, MUTED);
			y += 8;

			// Paid-by line
			if (showPaidBy) {
				y += 11;
				txt(`${i18n.paidBy} ${payerNamesStr}`, W / 2, y, 11, 'center', false, MUTED);
				y += 8;
			}

			// Transfers / allSettled
			if (transfers.length) {
				y += 8;
				dashed(y);
				y += 16;
				y += 10;
				txt(i18n.paysWhom, W / 2, y, 10, 'center', false, MUTED);
				y += 16;
				for (const tr of transfers) {
					y += 16;
					txt(tr.from.name, PAD, y, 14, 'left', true, DARK);
					txt(tr.amount.toFixed(2), W - PAD, y, 14, 'right', true, DARK);
					y += 4;
					y += 12;
					txt(`↳ ${i18n.payVerb} ${tr.to.name}`, PAD + 16, y, 12, 'left', false, MUTED);
					y += 16;
				}
			} else {
				y += 16;
				txt(`✓ ${i18n.allSettled}`, W / 2, y, 13, 'center', true, GREEN);
				y += 12;
			}

			// Per-person (no payer set)
			if (!showPaidBy) {
				y += 8;
				dashed(y);
				y += 16;
				for (const s of [...perPerson].sort((a, b) => b.total - a.total)) {
					y += 16;
					txt(s.name, PAD, y, 14, 'left', false, DARK);
					txt(s.total.toFixed(2), W - PAD, y, 14, 'right', false, DARK);
					y += 4;
				}
				y += 10;
				txt(i18n.pickPaidHint, W / 2, y, 10, 'center', false, MUTED);
				y += 12;
			}

			// Totals
			y += 8;
			dashed(y);
			y += 16;

			y += 16;
			txt(i18n.subtotal, PAD, y, 14, 'left', false, DARK);
			txt(m(itemsSubtotal), W - PAD, y, 14, 'right', false, DARK);
			y += 8;

			if (tip > 0) {
				y += 16;
				txt(i18n.tip, PAD, y, 14, 'left', false, DARK);
				txt(m(tipAmt), W - PAD, y, 14, 'right', false, DARK);
				y += 8;
			}

			if (fixed > 0) {
				y += 16;
				txt(i18n.extra, PAD, y, 14, 'left', false, DARK);
				txt(m(n > 0 ? fixed : 0), W - PAD, y, 14, 'right', false, DARK);
				y += 8;
			}

			y += 8;
			solid(y);
			y += 16;

			y += 22;
			txt(i18n.total, PAD, y, 20, 'left', true, DARK);
			txt(m(grand), W - PAD, y, 20, 'right', true, DARK);
			y += 20;

			// Footer
			y += 12;
			dashed(y);
			y += 16;

			y += 11;
			txt('* * * THANK YOU * * *', W / 2, y, 11, 'center', false, LIGHT);
			y += 16;

			// Barcode — mirrors the CSS repeating-gradient from ReceiptTray
			const BARCODE_W = 128;
			const BARCODE_H = 32;
			const barcodeX = (W - BARCODE_W) / 2;
			y += 4;

			if (ctx) {
				const bars: [number, number][] = [
					[0, 1.5], [2.5, 4.5], [5.5, 8], [9, 10.5], [12, 13], [15, 17.5], [19, 20]
				];
				const repeatW = 22;
				ctx.fillStyle = 'rgba(33,30,26,0.5)';
				for (let bx = 0; bx < BARCODE_W; bx += repeatW) {
					for (const [start, end] of bars) {
						const rx = barcodeX + bx + start;
						const rw = Math.min(end - start, barcodeX + BARCODE_W - rx);
						if (rw > 0) ctx.fillRect(rx, y, rw, BARCODE_H);
					}
				}
			}

			y += BARCODE_H + 8;
			y += 10;
			txt('0 0 1 2 3 4 5 6 7', W / 2, y, 10, 'center', false, LIGHT);
			y += 20;

			// Bottom padding + zigzag
			y += 20;
			y += ZH;

			return y;
		}

		const H = paint(null, 0);
		const canvas = document.createElement('canvas');
		canvas.width = W * DPR;
		canvas.height = H * DPR;
		const ctx = canvas.getContext('2d')!;
		ctx.scale(DPR, DPR);
		paint(ctx, H);

		return new Promise<Blob>((resolve, reject) => {
			canvas.toBlob(
				(blob) => {
					if (blob) resolve(blob);
					else reject(new Error('Failed to generate receipt image'));
				},
				'image/png'
			);
		});
	}

	async function onShare(): Promise<void> {
		try {
			const blob = await generateReceiptImage();
			const file = new File([blob], 'clear-the-tab-receipt.png', { type: 'image/png' });
			if (navigator.canShare?.({ files: [file] })) {
				await navigator.share({ files: [file], title: t().billHead });
			} else {
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = 'clear-the-tab-receipt.png';
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(url);
			}
			flash('share');
		} catch {
			// user cancelled or share unavailable
		}
	}

	function onInstall(): void {
		if (!installPrompt) return;
		void installPrompt.prompt();
		installPrompt = null;
		canInstall = false;
	}

	onMount(() => {
		const hash = location.hash || '';
		const match = hash.match(/[#&]d=([^&]+)/);
		if (match) decodeState(match[1]);
		else loadFromStorage();
		initialized = true;

		const handleBeforeInstall = (e: Event) => {
			e.preventDefault();
			installPrompt = e as unknown as { prompt: () => Promise<void> };
			canInstall = true;
		};
		const handleAppInstalled = () => {
			installPrompt = null;
			canInstall = false;
		};
		window.addEventListener('beforeinstallprompt', handleBeforeInstall);
		window.addEventListener('appinstalled', handleAppInstalled);
		return () => {
			window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
			window.removeEventListener('appinstalled', handleAppInstalled);
		};
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
		<HeaderBar t={t()} onSettings={() => (settingsOpen = true)} />
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
		<TipServiceSection
			t={t()}
			{tip}
			tipAmountLabel={m(tipAmount)}
			currencySymbol={cur()}
			fixedValue={fixed ? fixed.toString() : ''}
			onTipChange={(value: number) => (tip = value)}
			onFixedChange={(value: number) => (fixed = value)}
		/>
		<WhoPaidSection t={t()} {people} {payers} onTogglePayer={({ id }) => togglePayer(id)} />
		<div class="sticky bottom-3 z-50">
			<div class="flex items-center gap-3 bg-primary border-thick border-primary rounded-2xl p-3">
				<div class="flex-1 flex flex-col gap-0.5">
					<div class="text-xs font-bold tracking-md text-muted-light">{t().billTotal}</div>
					<strong class="font-mono text-5xl font-bold text-white">{m(grand)}</strong>
				</div>
				<button
					type="button"
					disabled={!tallyEnabled}
					class="h-12 disabled:bg-border-light disabled:text-muted px-5 border-thick border-surface-light rounded-lg text-primary bg-accent font-bricolage font-extrabold text-2xl-0.5 cursor-pointer"
					onclick={() => tallyEnabled && (trayOpen = true)}
				>
					{t().tally}
				</button>
			</div>
		</div>
	</div>
</main>

<ReceiptTray
	open={trayOpen}
	t={t()}
	canSettle={tallyEnabled}
	{receiptTitle}
	{receiptDate}
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
	onTitleChange={(v) => (receiptTitle = v)}
	onDateChange={(v) => (receiptDate = v)}
/>

<SettingsModal
	open={settingsOpen}
	t={t()}
	{lang}
	{currency}
	{canInstall}
	onClose={() => (settingsOpen = false)}
	onLang={(value: Lang) => (lang = value)}
	onCurrency={(value: (typeof CURRENCIES)[number]) => (currency = value)}
	onReset={resetTab}
	{onInstall}
/>
