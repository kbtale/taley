import { seedResponseSchema, type SeedResponse } from '$lib/schemas/seed.js';
import {
	environmentBatchSchema,
	environmentCategorySchema,
	type EnvironmentCategory,
	type GenerationComplexity,
	generationMarkdownSectionOrder,
	universeMetadataSchema,
	characterBatchSchema
} from '$lib/schemas/generation.js';
import type { Node } from '$lib/schemas/node.js';
import type { Edge } from '$lib/schemas/edge.js';
import type { MentionRecord } from '$lib/schemas/mention.js';
import { requestTaleyAIMarkdown } from '$lib/server/ai.js';
import { buildCharacterPsychologySeedSet } from './personality.js';
import { extractMentionsFromNodes, normalizeName } from './mention-parser.js';
import { extractSectionJson } from './markdown-parser.js';

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
}): Promise<SeedResponse> {
	const { premise, complexity, rngSeed = Date.now() } = options;
	const nodesById = new Map<string, Node>();
	const nodeIdByNormalizedName = new Map<string, string>();
	const mentionsIndex: MentionRecord[] = [];
	const edges: Edge[] = [];
	const edgeKeys = new Set<string>();

	const universe = await runStageWithRetries('universe', () =>
		generateUniverseMetadata(premise, complexity)
	);

	for (const category of ENVIRONMENT_ORDER) {
		const generated = await runStageWithRetries(`environment:${category}`, () =>
			generateEnvironmentBatch({
				universe,
				category,
				complexity,
				existingNodes: [...nodesById.values()]
			})
		);

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
	);

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
			const unknownNode = createUnknownNode(mention, nodesById.size);
			upsertNode(unknownNode, nodesById, nodeIdByNormalizedName);
			targetId = unknownNode.id;
		}

		const edgeKey = `${mention.sourceNodeId}->${targetId}`;
		if (!edgeKeys.has(edgeKey)) {
			edges.push({ source: mention.sourceNodeId, target: targetId });
			edgeKeys.add(edgeKey);
		}
	}

	return seedResponseSchema.parse({
		universe,
		nodes: [...nodesById.values()],
		edges
	});
}

async function generateUniverseMetadata(premise: string, complexity: GenerationComplexity) {
	const prompt = [
		`Generate universe metadata for this seed premise: "${premise}".`,
		`Complexity: ${complexity}.`,
		`Return markdown with exactly one section heading: ## ${generationMarkdownSectionOrder[0]}`,
		'Inside that section include exactly one ```json fenced block with fields: id, name, seed_premise, constraints.',
		'Constraints must be an array of concise world rules.'
	].join('\n');

	const markdown = await requestTaleyAIMarkdown({
		prompt,
		formatInstruction: `Return ONLY markdown with exactly one section named ## ${generationMarkdownSectionOrder[0]} and a single json fenced block in that section.`
	});

	const parsedUniverse = extractSectionJson(markdown, generationMarkdownSectionOrder[0]);
	return universeMetadataSchema.parse(parsedUniverse);
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
		'Node shape: id, name, category, description, payload { description, dynamic_attributes[] }.',
		'Mention references inside descriptions using token format x!Name!x.',
		contextNames.length > 0 ? `Existing context: ${contextNames.join(', ')}` : 'No prior context yet.',
		`Return markdown with exactly one section heading: ## ${sectionName}.`,
		'Inside that section include exactly one ```json fenced block with either an array of nodes or an object { "nodes": [...] }.'
	].join('\n');

	const markdown = await requestTaleyAIMarkdown({
		prompt,
		formatInstruction: `Return ONLY markdown with exactly one section named ## ${sectionName} and a single json fenced block in that section.`
	});

	const parsedSection = extractSectionJson(markdown, sectionName);
	const normalizedPayload = Array.isArray(parsedSection)
		? { nodes: parsedSection }
		: parsedSection;
	const response = environmentBatchSchema.parse(normalizedPayload);

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
		'Node shape: id, name, category, description, payload.',
		'Character payload requires identity, appearance, psychology, biography, dynamic_attributes.',
		'Mention references inside descriptions using token format x!Name!x.',
		`Use these psychology seed tendencies (in order): ${JSON.stringify(psychologySeeds)}`,
		contextNames.length > 0 ? `Existing context: ${contextNames.join(', ')}` : 'No prior context.',
		`Return markdown with exactly one section heading: ## ${sectionName}.`,
		'Inside that section include exactly one ```json fenced block with either an array of nodes or an object { "nodes": [...] }.'
	].join('\n');

	const markdown = await requestTaleyAIMarkdown({
		prompt,
		formatInstruction: `Return ONLY markdown with exactly one section named ## ${sectionName} and a single json fenced block in that section.`
	});

	const parsedSection = extractSectionJson(markdown, sectionName);
	const normalizedPayload = Array.isArray(parsedSection)
		? { nodes: parsedSection }
		: parsedSection;
	const response = characterBatchSchema.parse(normalizedPayload);

	return response.nodes as Node[];
}

function upsertNode(node: Node, byId: Map<string, Node>, byName: Map<string, string>) {
	byId.set(node.id, node);
	const normalized = normalizeName(node.name);
	if (!byName.has(normalized)) {
		byName.set(normalized, node.id);
	}
}

function createUnknownNode(mention: MentionRecord, index: number): Node {
	const slug = normalizeName(mention.name).replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
	return {
		id: `node:unknown-${slug || 'entity'}-${index}`,
		name: mention.name,
		category: 'Unknown',
		description: 'Auto-created from unresolved mention token.',
		payload: {
			description: 'Unknown entity referenced in generated descriptions.',
			dynamic_attributes: ['unknown', 'unresolved_mention']
		}
	};
}

async function runStageWithRetries<T>(stage: string, run: () => Promise<T>): Promise<T> {
	let lastError: unknown;

	for (let attempt = 1; attempt <= STAGE_RETRY_ATTEMPTS; attempt++) {
		try {
			return await run();
		} catch (error: unknown) {
			lastError = error;
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
