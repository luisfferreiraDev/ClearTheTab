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
				{@const assigned = payers.includes(person.id)}

				<button
					type="button"
					class="px-4 pl-2 py-2 flex items-center border-2 transition-all gap-2 rounded-full font-bricolage font-bold cursor-pointer text-lg {assigned
						? `shadow-sm text-white  border-black`
						: ' text-muted-light  border-muted-light'}"
					style={assigned ? `background-color: ${person.color}` : ''}
					onclick={() => onTogglePayer({ id: person.id })}
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
	{:else}
		<div
			class="p-4 rounded-lg bg-empty-bg border-2 border-dashed border-border-lighter text-xs text-muted font-bold"
		>
			{t.payerEmptyPeople}
		</div>
	{/if}
</section>
