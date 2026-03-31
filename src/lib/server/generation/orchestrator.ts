import { seedResponseSchema, type SeedResponse } from '$lib/schemas/seed.js';
import {
	environmentBatchSchema,
	environmentBatchTupleSchema,
	environmentCategorySchema,
	type EnvironmentCategory,
	type GenerationComplexity,
	generationMarkdownSectionOrder,
	universeMetadataSchema,
	universeMetadataTupleSchema,
	characterBatchSchema,
	characterBatchTupleSchema
} from '$lib/schemas/generation.js';
import type { Node } from '$lib/schemas/node.js';
import type { Edge } from '$lib/schemas/edge.js';
import type { MentionRecord } from '$lib/schemas/mention.js';
import { requestTaleyAIMarkdown } from '$lib/server/ai.js';
import { buildCharacterPsychologySeedSet } from './personality.js';
import { extractMentionsFromNodes, normalizeName } from './mention-parser.js';
import { extractSectionArrayTuples } from './markdown-parser.js';
import {
	mapCharacterTupleToNode,
	mapEnvironmentTupleToNode,
	mapUniverseTupleToMetadata
} from './tuple-mappers.js';
import { buildUnknownNodeId } from './generation-ids.js';

const ENVIRONMENT_ORDER: EnvironmentCategory[] = [
	'Location',
	'Collective',
	'Event',
	'Phenomenon',
	'Concept',
	'Artifact'
];

const ENVIRONMENT_SECTION_BY_CATEGORY: Record<
	EnvironmentCategory,
	'Locations' | 'Collectives' | 'Events' | 'Phenomena' | 'Concepts' | 'Artifacts'
> = {
	Location: 'Locations',
	Collective: 'Collectives',
	Event: 'Events',
	Phenomenon: 'Phenomena',
	Concept: 'Concepts',
	Artifact: 'Artifacts'
};

const ENVIRONMENT_TARGETS: Record<GenerationComplexity, number> = {
	low: 12,
	medium: 21,
	high: 36
};

const STAGE_RETRY_ATTEMPTS = 3;

export async function generateUniverseByAlgorithm(options: {
	premise: string;
	complexity: GenerationComplexity;
	rngSeed?: number;
	runId?: string;
}): Promise<SeedResponse> {
	const { premise, complexity, rngSeed = Date.now(), runId = crypto.randomUUID() } = options;
	console.info(`[generation:${runId}] start premiseLength=${premise.length} complexity=${complexity}`);
	const nodesById = new Map<string, Node>();
	const nodeIdByNormalizedName = new Map<string, string>();
	const mentionsIndex: MentionRecord[] = [];
	const edges: Edge[] = [];
	const edgeKeys = new Set<string>();

	const universe = await runStageWithRetries('universe', () =>
		generateUniverseMetadata(premise, complexity)
	, runId);

	for (const category of ENVIRONMENT_ORDER) {
		const generated = await runStageWithRetries(`environment:${category}`, () =>
			generateEnvironmentBatch({
				universe,
				category,
				complexity,
				existingNodes: [...nodesById.values()]
			})
		, runId);

		for (const entity of generated) {
			upsertNode(entity, nodesById, nodeIdByNormalizedName);
		}

		mentionsIndex.push(...extractMentionsFromNodes(generated));
	}

	const psychologySeeds = buildCharacterPsychologySeedSet(complexity, rngSeed);
	const generatedCharacters = await runStageWithRetries('characters', () =>
		generateCharacterBatch({
			universe,
			complexity,
			existingNodes: [...nodesById.values()],
			psychologySeeds
		})
	, runId);

	for (const character of generatedCharacters) {
		upsertNode(character, nodesById, nodeIdByNormalizedName);
	}

	mentionsIndex.push(...extractMentionsFromNodes(generatedCharacters));

	for (const mention of mentionsIndex) {
		if (!nodesById.has(mention.sourceNodeId)) {
			continue;
		}

		let targetId = nodeIdByNormalizedName.get(mention.normalizedName);
		if (!targetId) {
			const unknownNode = createUnknownNode(mention);
			upsertNode(unknownNode, nodesById, nodeIdByNormalizedName);
			targetId = unknownNode.id;
		}

		const edgeKey = `${mention.sourceNodeId}->${targetId}`;
		if (!edgeKeys.has(edgeKey)) {
			edges.push({ source: mention.sourceNodeId, target: targetId });
			edgeKeys.add(edgeKey);
		}
	}

	const result = seedResponseSchema.parse({
		universe,
		nodes: [...nodesById.values()],
		edges
	});
	console.info(
		`[generation:${runId}] done nodes=${result.nodes.length} edges=${result.edges.length} unknown=${result.nodes.filter((n) => n.category === 'Unknown').length}`
	);
	return result;
}

async function generateUniverseMetadata(premise: string, complexity: GenerationComplexity) {
	const prompt = [
		`Generate universe metadata for this seed premise: "${premise}".`,
		`Complexity: ${complexity}.`,
		`Return markdown with exactly one section heading: ## ${generationMarkdownSectionOrder[0]}`,
		'Inside that section include exactly one fenced code block with one array tuple line in this exact order:',
		'[name, seed_premise, constraintsArray].',
		'constraintsArray must be an array of concise world rules.',
		'Use double quotes in array values and no explanatory prose inside the code block.'
	].join('\n');

	const markdown = await requestTaleyAIMarkdown({
		prompt,
		formatInstruction: `Return ONLY markdown with exactly one section named ## ${generationMarkdownSectionOrder[0]} and one fenced code block containing exactly one array tuple line.`
	});

	const tuples = extractSectionArrayTuples(markdown, generationMarkdownSectionOrder[0]);
	if (tuples.length !== 1) {
		throw new Error(`Section ${generationMarkdownSectionOrder[0]} must contain exactly one tuple line`);
	}
	const tuple = universeMetadataTupleSchema.parse(tuples[0]);
	return universeMetadataSchema.parse(mapUniverseTupleToMetadata(tuple));
}

async function generateEnvironmentBatch(options: {
	universe: Awaited<ReturnType<typeof generateUniverseMetadata>>;
	category: EnvironmentCategory;
	complexity: GenerationComplexity;
	existingNodes: Node[];
}): Promise<Node[]> {
	const { universe, category, complexity, existingNodes } = options;
	const batchSize = ENVIRONMENT_TARGETS[complexity];
	const contextNames = existingNodes.map((n) => `${n.category}:${n.name}`).slice(0, 80);
	const sectionName = ENVIRONMENT_SECTION_BY_CATEGORY[category];

	const prompt = [
		`Universe: ${universe.name}`,
		`Seed premise: ${universe.seed_premise}`,
		`Generate exactly ${batchSize} nodes with category "${category}".`,
		'Return one array tuple per line in this exact order:',
		'[name, description, dynamicAttributesArray].',
		'Mention references inside descriptions using token format x!Name!x.',
		contextNames.length > 0 ? `Existing context: ${contextNames.join(', ')}` : 'No prior context yet.',
		`Return markdown with exactly one section heading: ## ${sectionName}.`,
		'Inside that section include exactly one fenced code block containing only tuple lines (no object keys, no wrapper arrays).',
		'Use double quotes in array values.'
	].join('\n');

	const markdown = await requestTaleyAIMarkdown({
		prompt,
		formatInstruction: `Return ONLY markdown with exactly one section named ## ${sectionName} and one fenced code block containing tuple lines.`
	});

	const tupleLines = extractSectionArrayTuples(markdown, sectionName);
	const tuples = environmentBatchTupleSchema.parse(tupleLines);
	const mappedNodes = tuples.map((tuple, index) => mapEnvironmentTupleToNode(tuple, category, index));
	const response = environmentBatchSchema.parse({ nodes: mappedNodes });

	for (const node of response.nodes) {
		environmentCategorySchema.parse(node.category);
	}

	return response.nodes as Node[];
}

async function generateCharacterBatch(options: {
	universe: Awaited<ReturnType<typeof generateUniverseMetadata>>;
	complexity: GenerationComplexity;
	existingNodes: Node[];
	psychologySeeds: ReturnType<typeof buildCharacterPsychologySeedSet>;
}): Promise<Node[]> {
	const { universe, complexity, existingNodes, psychologySeeds } = options;
	const contextNames = existingNodes.map((n) => `${n.category}:${n.name}`).slice(0, 100);
	const sectionName = generationMarkdownSectionOrder[7];

	const prompt = [
		`Universe: ${universe.name}`,
		`Seed premise: ${universe.seed_premise}`,
		`Complexity: ${complexity}`,
		`Generate exactly ${psychologySeeds.length} Character nodes.`,
		'Return one Character array tuple per line. Each tuple must use this exact order:',
		'[name, description, identityName, age, species, gender, appearanceDescription, clothing, modifications, mbti, enneagram, openness, conscientiousness, extraversion, agreeableness, neuroticism, moralAlignment, biography, dynamicAttributesArray].',
		'Mention references inside descriptions using token format x!Name!x.',
		`Use these psychology seed tendencies (in order): ${JSON.stringify(psychologySeeds)}`,
		contextNames.length > 0 ? `Existing context: ${contextNames.join(', ')}` : 'No prior context.',
		`Return markdown with exactly one section heading: ## ${sectionName}.`,
		'Inside that section include exactly one fenced code block containing only tuple lines (no object keys, no wrapper arrays).',
		'Use double quotes in array values.'
	].join('\n');

	const markdown = await requestTaleyAIMarkdown({
		prompt,
		formatInstruction: `Return ONLY markdown with exactly one section named ## ${sectionName} and one fenced code block containing tuple lines.`
	});

	const tupleLines = extractSectionArrayTuples(markdown, sectionName);
	const tuples = characterBatchTupleSchema.parse(tupleLines);
	const mappedNodes = tuples.map((tuple, index) => mapCharacterTupleToNode(tuple, index));
	const response = characterBatchSchema.parse({ nodes: mappedNodes });

	return response.nodes as Node[];
}

function upsertNode(node: Node, byId: Map<string, Node>, byName: Map<string, string>) {
	byId.set(node.id, node);
	const normalized = normalizeName(node.name);
	if (!byName.has(normalized)) {
		byName.set(normalized, node.id);
	}
}

function createUnknownNode(mention: MentionRecord): Node {
	return {
		id: buildUnknownNodeId(mention.name, mention.normalizedName),
		name: mention.name,
		category: 'Unknown',
		description: 'Auto-created from unresolved mention token.',
		payload: {
			description: 'Unknown entity referenced in generated descriptions.',
			dynamic_attributes: ['unknown', 'unresolved_mention']
		}
	};
}

async function runStageWithRetries<T>(stage: string, run: () => Promise<T>, runId: string): Promise<T> {
	let lastError: unknown;

	for (let attempt = 1; attempt <= STAGE_RETRY_ATTEMPTS; attempt++) {
		const startedAt = Date.now();
		try {
			const result = await run();
			console.info(`[generation:${runId}] stage=${stage} attempt=${attempt} status=ok durationMs=${Date.now() - startedAt}`);
			return result;
		} catch (error: unknown) {
			lastError = error;
			const message = error instanceof Error ? error.message : String(error);
			console.warn(`[generation:${runId}] stage=${stage} attempt=${attempt} status=error durationMs=${Date.now() - startedAt} message=${message}`);
			if (attempt === STAGE_RETRY_ATTEMPTS) {
				break;
			}
			const waitMs = attempt * 500;
			await new Promise((resolve) => setTimeout(resolve, waitMs));
		}
	}

	const message = lastError instanceof Error ? lastError.message : String(lastError);
	throw new Error(`Stage failed after retries: ${stage}. ${message}`);
}
