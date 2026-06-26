<script lang="ts">
	import type { I18n, Person } from './types';

	let {
		t,
		people = [],
		payers = [],
		onTogglePayer = () => {}
	}: {
		t: I18n;
		people?: Person[];
		payers?: string[];
		onTogglePayer?: (payload: { id: string }) => void;
	} = $props();
</script>

<section class="bg-white border-thick border-primary rounded-3xl shadow-lg p-4">
	<div class="flex items-center gap-2 mb-1">
		<span
			class="text-xs font-bricolage font-extrabold tracking-xs text-white bg-primary px-2 py-0.5 rounded-xs"
			>{t.step3}</span
		>
		<h2 class="m-0 text-xl font-bold text-primary-light">{t.whoPaid}</h2>
	</div>
	<p class="text-xs text-muted font-bold m-0 mb-3">{t.whoPaidSub}</p>
	{#if people.length}
		<div class="flex flex-wrap gap-2">
			{#each people as person (person.id)}
				<button
					type="button"
					class:border-primary={payers.includes(person.id)}
					class:opacity-100={payers.includes(person.id)}
					class:opacity-45={!payers.includes(person.id)}
					class="px-4 py-2 rounded-full font-bricolage font-bold cursor-pointer border-thick border-border-light text-white text-lg"
					style={`background-color: ${person.color}`}
					onclick={() => onTogglePayer({ id: person.id })}
				>
					{person.name}
				</button>
			{/each}
		</div>
	{:else}
		<div
			class="p-4 rounded-lg bg-empty-bg border-2 border-dashed border-border-lighter text-xs text-muted font-bold"
		>
			{t.payerEmptyPeople}
		</div>
	{/if}
</section>
