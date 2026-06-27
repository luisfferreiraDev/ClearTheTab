<script lang="ts">
	import type { I18n } from './types';
	import { parseReceiptText, type ParsedItem } from './receiptParser';

	let {
		t,
		currencySymbol = 'EUR ',
		onAdd = () => {}
	}: {
		t: I18n;
		currencySymbol?: string;
		onAdd?: (payload: { name: string; price: number }) => void;
	} = $props();

	let fileInput: HTMLInputElement;
	let isLoading = $state(false);
	let showModal = $state(false);
	let parsedItems = $state<ParsedItem[]>([]);
	let selectedIndices = $state(new Set<number>());

	const selectedTotal = $derived(
		[...selectedIndices].reduce((sum, i) => sum + (parsedItems[i]?.price ?? 0), 0)
	);

	function triggerCamera(): void {
		fileInput.click();
	}

	async function handleFileChange(event: Event): Promise<void> {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		isLoading = true;

		try {
			const { createWorker } = await import('tesseract.js');
			const worker = await createWorker(['por', 'eng']);
			const { data } = await worker.recognize(file);
			await worker.terminate();

			const items = parseReceiptText(data.text);
			parsedItems = items;
			selectedIndices = new Set();
			if (items.length) showModal = true;
		} catch (err) {
			console.error('[ReceiptScanner] OCR failed:', err);
		} finally {
			isLoading = false;
			input.value = '';
		}
	}

	function toggleItem(index: number): void {
		const next = new Set(selectedIndices);
		if (next.has(index)) {
			next.delete(index);
		} else {
			next.add(index);
		}
		selectedIndices = next;
	}

	function confirmSelection(): void {
		for (const i of selectedIndices) {
			const item = parsedItems[i];
			if (item) onAdd({ name: item.name, price: item.price });
		}
		closeModal();
	}

	function closeModal(): void {
		showModal = false;
		parsedItems = [];
		selectedIndices = new Set();
	}
</script>

<!-- Camera trigger button -->
<button
	type="button"
	title={t.scanReceipt}
	aria-label={t.scanReceipt}
	class="w-12 h-12 shrink-0 border-thick border-primary rounded-sm cursor-pointer flex items-center justify-center text-primary bg-surface-light hover:bg-border-lighter transition-colors"
	onclick={triggerCamera}
>
	<svg
		aria-hidden="true"
		width="20"
		height="20"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2.5"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
		<circle cx="12" cy="13" r="4" />
	</svg>
</button>

<!-- Hidden native file input — capture="environment" opens rear camera on mobile -->
<input
	type="file"
	accept="image/*"
	capture="environment"
	class="hidden"
	bind:this={fileInput}
	onchange={handleFileChange}
/>

<!-- Loading overlay -->
{#if isLoading}
	<div class="fixed inset-0 z-[200] bg-black/70 flex flex-col items-center justify-center gap-5">
		<div class="w-11 h-11 rounded-full border-4 border-white/30 border-t-white animate-spin"></div>
		<p class="text-white font-bricolage font-bold text-xl text-center px-8">
			{t.readingReceipt}
		</p>
	</div>
{/if}

<!-- Selection modal — bottom sheet -->
{#if showModal}
	<div
		role="presentation"
		class="fixed inset-0 z-[200] bg-black/60 flex flex-col"
		onclick={closeModal}
		onkeydown={(e) => e.key === 'Escape' && closeModal()}
	>
		<div
			role="dialog"
			aria-modal="true"
			aria-label={t.selectItems}
			tabindex="-1"
			class="mt-auto bg-surface-light rounded-t-3xl max-h-[88vh] flex flex-col border-t-[2.5px] border-l-[2.5px] border-r-[2.5px] border-primary"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<!-- Handle bar -->
			<div class="flex justify-center pt-3 pb-1">
				<div class="w-10 h-1 rounded-full bg-border-light"></div>
			</div>

			<!-- Header -->
			<div class="flex items-center justify-between px-5 pt-3 pb-3">
				<h2 class="font-bricolage font-extrabold text-2xl text-primary">{t.selectItems}</h2>
				<button
					type="button"
					onclick={closeModal}
					class="w-8 h-8 flex items-center justify-center rounded-full bg-border-lighter text-primary font-bold cursor-pointer hover:bg-border-light transition-colors text-base"
					aria-label={t.done}
				>
					✕
				</button>
			</div>

			<!-- Scrollable items list -->
			<div class="overflow-y-auto flex-1 px-4 pb-2 flex flex-col gap-2">
				{#each parsedItems as item, i}
					{@const selected = selectedIndices.has(i)}
					<button
						type="button"
						onclick={() => toggleItem(i)}
						class="flex items-center justify-between w-full px-4 py-3.5 rounded-2xl border-thick text-left cursor-pointer transition-all duration-200 active:scale-[0.98] {selected
							? 'bg-success/10 border-success'
							: 'border-primary bg-white hover:bg-surface-lighter'}"
					>
						<div class="flex items-center gap-3 min-w-0">
							<span
								class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold text-white shrink-0 transition-colors duration-200 {selected
									? 'bg-success'
									: 'bg-border-light'}"
							>
								{selected ? '✓' : ''}
							</span>
							<span class="font-bricolage font-bold text-lg text-primary truncate">{item.name}</span>
						</div>
						<span class="font-mono font-bold text-lg {selected ? 'text-success' : 'text-primary'} ml-3 shrink-0">
							{currencySymbol}{item.price.toFixed(2)}
						</span>
					</button>
				{/each}
			</div>

			<!-- Sticky confirm footer -->
			<div class="px-4 pt-3 pb-7 border-t border-border-lighter">
				<div class="flex items-center justify-between mb-3 px-1">
					<span class="font-bricolage font-bold text-base text-muted-light">
						{selectedIndices.size} {t.itemsHead}
					</span>
					<span class="font-mono font-extrabold text-xl {selectedIndices.size > 0 ? 'text-success' : 'text-muted-lighter'}">
						{currencySymbol}{selectedTotal.toFixed(2)}
					</span>
				</div>
				<button
					type="button"
					onclick={confirmSelection}
					disabled={selectedIndices.size === 0}
					class="w-full h-14 rounded-2xl font-bricolage font-extrabold text-xl text-white cursor-pointer transition-opacity {selectedIndices.size > 0 ? 'bg-accent hover:opacity-90' : 'bg-border-light cursor-not-allowed'}"
				>
					{t.done}
				</button>
			</div>
		</div>
	</div>
{/if}
