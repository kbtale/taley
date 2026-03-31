import { describe, expect, it } from 'vitest';
import { buildCharacterPsychologySeedSet } from './personality';

describe('personality congruence sampler', () => {
	it('is deterministic for the same seed', () => {
		const a = buildCharacterPsychologySeedSet('low', 42);
		const b = buildCharacterPsychologySeedSet('low', 42);
		expect(a).toEqual(b);
	});

	it('produces expected counts by complexity', () => {
		expect(buildCharacterPsychologySeedSet('low', 1)).toHaveLength(9);
		expect(buildCharacterPsychologySeedSet('medium', 1)).toHaveLength(18);
		expect(buildCharacterPsychologySeedSet('high', 1)).toHaveLength(27);
	});

	it('keeps all big5 values in [1, 100]', () => {
		const values = buildCharacterPsychologySeedSet('high', 99);
		for (const seed of values) {
			expect(seed.big5.openness).toBeGreaterThanOrEqual(1);
			expect(seed.big5.openness).toBeLessThanOrEqual(100);
			expect(seed.big5.conscientiousness).toBeGreaterThanOrEqual(1);
			expect(seed.big5.conscientiousness).toBeLessThanOrEqual(100);
			expect(seed.big5.extraversion).toBeGreaterThanOrEqual(1);
			expect(seed.big5.extraversion).toBeLessThanOrEqual(100);
			expect(seed.big5.agreeableness).toBeGreaterThanOrEqual(1);
			expect(seed.big5.agreeableness).toBeLessThanOrEqual(100);
			expect(seed.big5.neuroticism).toBeGreaterThanOrEqual(1);
			expect(seed.big5.neuroticism).toBeLessThanOrEqual(100);
		}
	});

	it('uses valid taxonomy values', () => {
		const seeds = buildCharacterPsychologySeedSet('medium', 777);
		const validMbti = new Set(['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP']);
		const validEnneagram = new Set(['1w9', '1w2', '2w1', '2w3', '3w2', '3w4', '4w3', '4w5', '5w4', '5w6', '6w5', '6w7', '7w6', '7w8', '8w7', '8w9', '9w8', '9w1']);
		const validAlignment = new Set(['Lawful Good', 'Neutral Good', 'Chaotic Good', 'Lawful Neutral', 'True Neutral', 'Chaotic Neutral', 'Lawful Evil', 'Neutral Evil', 'Chaotic Evil']);

		for (const seed of seeds) {
			expect(validMbti.has(seed.mbti)).toBe(true);
			expect(validEnneagram.has(seed.enneagram)).toBe(true);
			expect(validAlignment.has(seed.moral_alignment)).toBe(true);
		}
	});
});
