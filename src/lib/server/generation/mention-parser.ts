import type { Node } from '$lib/schemas/node.js';
import type { MentionRecord, MentionToken } from '$lib/schemas/mention.js';

const MENTION_PATTERN = /([a-z])!([^!]+)!\1(?:'s)?/g;

export function parseMentionTokens(text: string): MentionToken[] {
	const tokens: MentionToken[] = [];
	const seen = new Set<string>();
	let match: RegExpExecArray | null;

	while ((match = MENTION_PATTERN.exec(text)) !== null) {
		const categoryInitial = match[1] ?? '';
		const name = (match[2] ?? '').trim();
		if (!name) {
			continue;
		}
		const rawToken = match[0];
		const offset = match.index;
		const key = `${categoryInitial}|${name}|${offset}`;
		if (seen.has(key)) {
			continue;
		}
		seen.add(key);

		tokens.push({
			categoryInitial,
			name,
			rawToken,
			offset
		});
	}

	return tokens;
}

export function extractMentionsFromNodes(nodes: Node[]): MentionRecord[] {
	const mentions: MentionRecord[] = [];

	for (const node of nodes) {
		const payloadDescription =
			node.category === 'Character' ? '' : (node.payload.description ?? '');
		const text = [node.description, payloadDescription].filter(Boolean).join('\n');
		const parsed = parseMentionTokens(text);

		for (const token of parsed) {
			mentions.push({
				sourceNodeId: node.id,
				normalizedName: normalizeName(token.name),
				...token
			});
		}
	}

	return mentions;
}

export function normalizeName(name: string): string {
	return name.toLowerCase().trim().replace(/\s+/g, ' ');
}
