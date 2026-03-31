import type { Node } from '$lib/schemas/node.js';
import type { MentionRecord, MentionToken } from '$lib/schemas/mention.js';

const MENTION_PATTERN = /([a-z])!([^!]+)!\1(?:'s)?/g;

export function parseMentionTokens(text: string): MentionToken[] {
	const tokens: MentionToken[] = [];
	let match: RegExpExecArray | null;

	while ((match = MENTION_PATTERN.exec(text)) !== null) {
		tokens.push({
			categoryInitial: match[1] ?? '',
			name: (match[2] ?? '').trim(),
			rawToken: match[0],
			offset: match.index
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
