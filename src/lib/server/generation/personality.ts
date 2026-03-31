import type { GenerationComplexity } from '$lib/schemas/generation.js';

export interface CharacterPsychologySeed {
	mbti: string;
	enneagram: string;
	big5: {
		openness: number;
		conscientiousness: number;
		extraversion: number;
		agreeableness: number;
		neuroticism: number;
	};
	moral_alignment: string;
}

const MBTI = ['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP'];
const ENNEAGRAM = ['1w9', '1w2', '2w1', '2w3', '3w2', '3w4', '4w3', '4w5', '5w4', '5w6', '6w5', '6w7', '7w6', '7w8', '8w7', '8w9', '9w8', '9w1'];
const ALIGNMENTS = ['Lawful Good', 'Neutral Good', 'Chaotic Good', 'Lawful Neutral', 'True Neutral', 'Chaotic Neutral', 'Lawful Evil', 'Neutral Evil', 'Chaotic Evil'];

const CHARACTER_COUNT_BY_COMPLEXITY: Record<GenerationComplexity, number> = {
	low: 9,
	medium: 18,
	high: 27
};

export function buildCharacterPsychologySeedSet(complexity: GenerationComplexity, seed = Date.now()): CharacterPsychologySeed[] {
	const rng = createRng(seed);
	const count = CHARACTER_COUNT_BY_COMPLEXITY[complexity];
	const output: CharacterPsychologySeed[] = [];

	for (let i = 0; i < count; i++) {
		const mbti = pick(MBTI, rng);
		const enneagram = pick(ENNEAGRAM, rng);
		const moral_alignment = pick(ALIGNMENTS, rng);

		output.push({
			mbti,
			enneagram,
			big5: {
				openness: score(rng),
				conscientiousness: score(rng),
				extraversion: score(rng),
				agreeableness: score(rng),
				neuroticism: score(rng)
			},
			moral_alignment
		});
	}

	return output;
}

function score(rng: () => number): number {
	return Math.max(1, Math.min(100, Math.round(rng() * 100)));
}

function pick<T>(arr: T[], rng: () => number): T {
	return arr[Math.floor(rng() * arr.length)] as T;
}

function createRng(seed: number): () => number {
	let state = seed >>> 0;
	return () => {
		state ^= state << 13;
		state ^= state >>> 17;
		state ^= state << 5;
		return ((state >>> 0) % 1_000_000) / 1_000_000;
	};
}
