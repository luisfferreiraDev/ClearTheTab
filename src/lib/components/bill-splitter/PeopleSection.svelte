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

<section class="card">
	<div class="head">
		<span class="step">{t.step1}</span>
		<h2>{t.who}</h2>
	</div>
	<div class="add-row">
		<input
			bind:value={name}
			onkeydown={(e) => e.key === 'Enter' && submit()}
			placeholder={t.addFriend}
		/>
		<button type="button" onclick={submit}>{t.add}</button>
	</div>

	{#if people.length}
		<div class="chips">
			{#each people as person (person.id)}
				<div class="chip">
					<span class="avatar" style={`background:${person.color}`}
						>{person.name[0]?.toUpperCase() ?? '?'}</span
					>
					<span class="name">{person.name}</span>
					<button type="button" aria-label="Remove" onclick={() => onRemove({ id: person.id })}
						>x</button
					>
				</div>
			{/each}
		</div>
	{:else}
		<div class="empty">Add everyone who shared the bill. Each person gets a color.</div>
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
		display: flex;
		gap: 9px;
	}
	input {
		flex: 1;
		height: 50px;
		border: 2.5px solid #211e1a;
		border-radius: 13px;
		padding: 0 15px;
		font-size: 16px;
		font-weight: 600;
		background: #fffdf8;
	}
	.add-row > button {
		height: 50px;
		padding: 0 20px;
		border: 2.5px solid #211e1a;
		border-radius: 13px;
		background: #211e1a;
		color: #fff;
		font:
			700 15px 'Bricolage Grotesque',
			system-ui;
		cursor: pointer;
	}
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 9px;
		margin-top: 14px;
	}
	.chip {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 5px 9px 5px 5px;
		border-radius: 999px;
		background: #fff;
		border: 2px solid #211e1a;
		box-shadow: 2px 2px 0 #211e1a;
	}
	.avatar {
		width: 21px;
		height: 21px;
		display: grid;
		place-items: center;
		border-radius: 999px;
		font-size: 10px;
		font-weight: 800;
		color: #fff;
		border: 1.5px solid #211e1a;
	}
	.name {
		font-size: 14px;
		font-weight: 700;
		color: #211e1a;
	}
	.chip button {
		width: 21px;
		height: 21px;
		border: none;
		border-radius: 50%;
		background: #f0e7d6;
		color: #8a7e6a;
		font-size: 14px;
		cursor: pointer;
	}
	.empty {
		margin-top: 13px;
		padding: 14px 15px;
		border-radius: 14px;
		background: #fbf4e7;
		border: 2px dashed #e0d4bd;
		font-size: 13px;
		color: #8a7e6a;
		font-weight: 600;
	}
</style>
