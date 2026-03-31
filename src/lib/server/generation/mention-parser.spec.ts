import { describe, expect, it } from 'vitest';
import { extractMentionsFromNodes, normalizeName, parseMentionTokens } from './mention-parser';
import type { Node } from '$lib/schemas/node';

describe('mention parser', () => {
	it('parses normal and possessive tokens', () => {
		const text = "l!Asgard!l rose over a!Mjolnir!a and l!Asgard!l's gates.";
		const parsed = parseMentionTokens(text);
		expect(parsed).toHaveLength(3);
		expect(parsed[0]?.name).toBe('Asgard');
		expect(parsed[1]?.name).toBe('Mjolnir');
		expect(parsed[2]?.rawToken).toBe("l!Asgard!l's");
	});

	it('ignores malformed and blank tokens', () => {
		const text = 'l!Asgard!a l!   !l a!!a c!Guild!c';
		const parsed = parseMentionTokens(text);
		expect(parsed).toHaveLength(1);
		expect(parsed[0]?.name).toBe('Guild');
	});

	it('normalizes names', () => {
		expect(normalizeName('  The   Red   Keep  ')).toBe('the red keep');
	});

	it('extracts from node description and non-character payload description', () => {
		const locationNode: Node = {
			id: 'node:1',
			name: 'Harbor District',
			category: 'Location',
			description: 'Trade route touches l!Stormwall!l.',
			payload: {
				description: 'Old records mention c!Dock Union!c.',
				dynamic_attributes: ['port']
			}
		};

		const characterNode: Node = {
			id: 'node:2',
			name: 'Ari',
			category: 'Character',
			description: 'Ari seeks a!Sun Compass!a.',
			payload: {
				identity: { name: 'Ari', age: 29, species: 'Human', gender: 'Non-binary' },
				appearance: { description: 'Lean', clothing: 'Traveler coat', modifications: 'None' },
				psychology: {
					mbti: 'INTJ',
					enneagram: '5w6',
					big5: { openness: 80, conscientiousness: 75, extraversion: 30, agreeableness: 45, neuroticism: 35 },
					moral_alignment: 'Neutral Good'
				},
				biography: 'Navigator from the inner bays.',
				dynamic_attributes: ['navigator']
			}
		};

		const mentions = extractMentionsFromNodes([locationNode, characterNode]);
		expect(mentions.map((m) => m.name)).toEqual(['Stormwall', 'Dock Union', 'Sun Compass']);
		expect(mentions[0]?.sourceNodeId).toBe('node:1');
		expect(mentions[2]?.sourceNodeId).toBe('node:2');
	});
});
