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

type Archetype = 'Analytical' | 'Diplomatic' | 'Sentinel' | 'Explorer';
type Weighted<T> = readonly [T, number];

const MBTI_TO_ARCHETYPE: Record<string, Archetype> = {
	INTJ: 'Analytical',
	INTP: 'Analytical',
	ENTJ: 'Analytical',
	ENTP: 'Analytical',
	INFJ: 'Diplomatic',
	INFP: 'Diplomatic',
	ENFJ: 'Diplomatic',
	ENFP: 'Diplomatic',
	ISTJ: 'Sentinel',
	ISFJ: 'Sentinel',
	ESTJ: 'Sentinel',
	ESFJ: 'Sentinel',
	ISTP: 'Explorer',
	ISFP: 'Explorer',
	ESTP: 'Explorer',
	ESFP: 'Explorer'
};

const ENNEAGRAM_BY_ARCHETYPE: Record<Archetype, readonly Weighted<string>[]> = {
	Analytical: [
		['5w6', 32],
		['5w4', 22],
		['1w9', 16],
		['3w4', 14],
		['8w7', 10],
		['6w5', 6]
	],
	Diplomatic: [
		['4w5', 24],
		['4w3', 16],
		['2w1', 18],
		['2w3', 14],
		['9w1', 16],
		['1w2', 12]
	],
	Sentinel: [
		['1w9', 26],
		['1w2', 16],
		['6w5', 26],
		['6w7', 14],
		['2w1', 10],
		['9w1', 8]
	],
	Explorer: [
		['7w8', 24],
		['7w6', 16],
		['8w7', 18],
		['8w9', 10],
		['3w2', 14],
		['9w8', 18]
	]
};

const ALIGNMENT_BY_ARCHETYPE: Record<Archetype, readonly Weighted<string>[]> = {
	Analytical: [
		['Lawful Neutral', 22],
		['True Neutral', 20],
		['Neutral Evil', 14],
		['Chaotic Neutral', 12],
		['Lawful Evil', 12],
		['Neutral Good', 10],
		['Lawful Good', 10]
	],
	Diplomatic: [
		['Neutral Good', 24],
		['Chaotic Good', 18],
		['Lawful Good', 14],
		['True Neutral', 16],
		['Chaotic Neutral', 12],
		['Lawful Neutral', 10],
		['Neutral Evil', 6]
	],
	Sentinel: [
		['Lawful Good', 26],
		['Lawful Neutral', 22],
		['Neutral Good', 16],
		['True Neutral', 16],
		['Lawful Evil', 8],
		['Chaotic Good', 6],
		['Neutral Evil', 6]
	],
	Explorer: [
		['Chaotic Neutral', 24],
		['Chaotic Good', 18],
		['True Neutral', 18],
		['Neutral Good', 12],
		['Chaotic Evil', 10],
		['Neutral Evil', 10],
		['Lawful Neutral', 8]
	]
};

const BIG5_PROFILE_BY_ARCHETYPE: Record<
	Archetype,
	{
		openness: number;
		conscientiousness: number;
		extraversion: number;
		agreeableness: number;
		neuroticism: number;
	}
> = {
	Analytical: { openness: 76, conscientiousness: 68, extraversion: 42, agreeableness: 45, neuroticism: 48 },
	Diplomatic: { openness: 71, conscientiousness: 56, extraversion: 59, agreeableness: 74, neuroticism: 55 },
	Sentinel: { openness: 46, conscientiousness: 79, extraversion: 53, agreeableness: 66, neuroticism: 42 },
	Explorer: { openness: 63, conscientiousness: 46, extraversion: 73, agreeableness: 53, neuroticism: 46 }
};

export function buildCharacterPsychologySeedSet(complexity: GenerationComplexity, seed = Date.now()): CharacterPsychologySeed[] {
	const rng = createRng(seed);
	const count = CHARACTER_COUNT_BY_COMPLEXITY[complexity];
	const output: CharacterPsychologySeed[] = [];

	for (let i = 0; i < count; i++) {
		const mbti = pick(MBTI, rng);
		const archetype = MBTI_TO_ARCHETYPE[mbti] ?? 'Analytical';
		const enneagram = weightedPick(ENNEAGRAM_BY_ARCHETYPE[archetype], rng);
		const moral_alignment = weightedPick(ALIGNMENT_BY_ARCHETYPE[archetype], rng);
		const base = BIG5_PROFILE_BY_ARCHETYPE[archetype];

		output.push({
			mbti,
			enneagram,
			big5: {
				openness: scoreAround(base.openness, rng),
				conscientiousness: scoreAround(base.conscientiousness, rng),
				extraversion: scoreAround(base.extraversion, rng),
				agreeableness: scoreAround(base.agreeableness, rng),
				neuroticism: scoreAround(base.neuroticism, rng)
			},
			moral_alignment
		});
	}

	return output;
}

function pick<T>(arr: T[], rng: () => number): T {
	return arr[Math.floor(rng() * arr.length)] as T;
}

function weightedPick<T>(entries: readonly Weighted<T>[], rng: () => number): T {
	const total = entries.reduce((sum, entry) => sum + entry[1], 0);
	let roll = rng() * total;

	for (const [value, weight] of entries) {
		roll -= weight;
		if (roll <= 0) {
			return value;
		}
	}

	return entries[entries.length - 1]![0];
}

function scoreAround(base: number, rng: () => number): number {
	const spread = 14;
	const offset = (rng() - rng()) * spread;
	return Math.max(1, Math.min(100, Math.round(base + offset)));
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
