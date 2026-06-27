export interface ParsedItem {
	name: string;
	price: number;
}

// Detects barcode/serial lines like "J 5600252048031" or purely numeric strings
function looksLikeBarcode(name: string): boolean {
	if (/^[A-Z]\s+\d{6,}/.test(name)) return true;
	if (/^\d+$/.test(name)) return true;
	if (/\d{8,}/.test(name)) return true;
	return false;
}

export function parseReceiptText(text: string): ParsedItem[] {
	const results: ParsedItem[] = [];
	let prevNameCandidate = '';

	for (const line of text.split('\n')) {
		const trimmed = line.trim();
		if (!trimmed) continue;

		const matches = [...trimmed.matchAll(/(\d+[.,]\d{2})/g)];
		if (!matches.length) {
			// No price — could be the product name for the next line
			prevNameCandidate = trimmed;
			continue;
		}

		// Rightmost numeric match is the price
		const lastMatch = matches[matches.length - 1];
		const price = parseFloat(lastMatch[1].replace(',', '.'));
		if (!price || price <= 0) {
			prevNameCandidate = trimmed;
			continue;
		}

		// Everything left of the price is the item name
		const nameRaw = trimmed.slice(0, lastMatch.index).trim();
		let name = nameRaw.replace(/[-.\s…]+$/, '').trim();

		// If the name looks like a barcode, use the previous line as the name
		if (name.length < 2 || looksLikeBarcode(name)) {
			if (prevNameCandidate.length >= 2) {
				name = prevNameCandidate;
			} else {
				prevNameCandidate = '';
				continue;
			}
		}

		results.push({ name, price });
		prevNameCandidate = '';
	}

	return results;
}
