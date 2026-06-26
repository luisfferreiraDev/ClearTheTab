export type Lang = 'en' | 'es' | 'pt' | 'fr';

export interface Person {
	id: string;
	name: string;
	color: string;
}

export interface BillItem {
	id: string;
	name: string;
	price: number;
	assigned: string[];
}

export interface PersonShare extends Person {
	base: number;
	total: number;
}

export interface Transfer {
	from: Person;
	to: Person;
	amount: number;
}

export interface I18n {
	subtitle: string;
	step1: string;
	step2: string;
	step3: string;
	who: string;
	what: string;
	whoPaid: string;
	whoPaidSub: string;
	addFriend: string;
	add: string;
	itemPh: string;
	everyone: string;
	tapWho: string;
	addToSplit: string;
	eachWord: string;
	person: string;
	people: string;
	addFriendsFirst: string;
	noItems: string;
	hintNoPeople: string;
	hintItems: string;
	tipService: string;
	none: string;
	sharedExtra: string;
	sharedExtraSub: string;
	billTotal: string;
	tally: string;
	addPeopleItems: string;
	tableReceipt: string;
	subtotal: string;
	tip: string;
	extra: string;
	total: string;
	copyText: string;
	shareLink: string;
	copied: string;
	linkCopied: string;
	nothing: string;
	settleNoPeople: string;
	settleItems: string;
	settings: string;
	language: string;
	currency: string;
	done: string;
	owe: string;
	billHead: string;
	itemsHead: string;
	totalWord: string;
	tipWord: string;
	extraWord: string;
	payerEmptyPeople: string;
	paysWhom: string;
	payVerb: string;
	allSettled: string;
	pickPaidHint: string;
	paidBy: string;
	resetTab: string;
}
