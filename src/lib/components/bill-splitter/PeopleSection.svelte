<script lang="ts">
	import type { I18n, Person } from './types';

	let {
		t,
		people = [],
		onAdd = () => {},
		onRemove = () => {}
	}: {
		t: I18n;
		people?: Person[];
		onAdd?: (payload: { name: string }) => void;
		onRemove?: (payload: { id: string }) => void;
	} = $props();

	let name = $state('');

	function submit(): void {
		const trimmed = name.trim();
		if (!trimmed) return;
		onAdd({ name: trimmed });
		name = '';
	}
</script>

<section class="bg-white border-thick border-primary rounded-3xl shadow-lg p-4">
	<div class="flex items-center gap-2 mb-3">
		<span
			class="text-xs font-bricolage font-extrabold tracking-xs text-white bg-primary px-2 py-0.5 rounded-xs"
			>{t.step1}</span
		>
		<h2 class="m-0 text-xl font-bold text-primary-light">{t.who}</h2>
	</div>
	<div class="flex gap-md">
		<input
			bind:value={name}
			onkeydown={(e) => e.key === 'Enter' && submit()}
			placeholder={t.addFriend}
			class="flex-1 h-12 border-thick border-primary rounded-md p-0 px-4 text-2xl font-bold bg-surface-light"
		/>
		<button
			type="button"
			class="h-12 px-5 border-thick border-primary rounded-md bg-primary text-white font-bricolage font-bold cursor-pointer text-2xl-0.5"
			onclick={submit}>{t.add}</button
		>
	</div>

	{#if people.length}
		<div class="flex flex-wrap gap-md mt-3">
			{#each people as person (person.id)}
				<div
					class="inline-flex items-center gap-2 py-1 pr-2 pl-1 rounded-full bg-white border-2 border-primary shadow-sm"
				>
					<span
						class="w-5 h-5 grid place-items-center rounded-full text-xs font-extrabold text-white border border-primary"
						style={`background:${person.color}`}>{person.name[0]?.toUpperCase() ?? '?'}</span
					>
					<span class="text-xl font-bold text-primary">{person.name}</span>
					<button
						type="button"
						aria-label="Remove"
						class="w-5 h-5 border-none rounded-full bg-gray-100 text-muted text-xl cursor-pointer"
						onclick={() => onRemove({ id: person.id })}>x</button
					>
				</div>
			{/each}
		</div>
	{:else}
		<div
			class="mt-3 p-4 rounded-lg bg-empty-bg border-2 border-dashed border-border-lighter text-lg text-muted font-bold"
		>
			Add everyone who shared the bill. Each person gets a color.
		</div>
	{/if}
</section>
