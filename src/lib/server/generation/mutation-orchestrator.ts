import type { Edge } from '$lib/schemas/edge.js';
import type { Node } from '$lib/schemas/node.js';
import { nodeSchema } from '$lib/schemas/node.js';
import {
	createEdgeOperationSchema,
	createNodeOperationSchema,
	mutationResponseSchema,
	updateNodeOperationSchema,
	type MutationOperation,
	type MutationResponse
} from '$lib/schemas/mutation.js';
import { requestTaleyAIMarkdown } from '$lib/server/ai.js';
import { extractSectionArrayTuples } from './markdown-parser.js';

const STAGE_RETRY_ATTEMPTS = 3;

const SECTION_SUMMARY = 'Summary';
const SECTION_CREATED_NODES = 'CreatedNodes';
const SECTION_UPDATED_NODES = 'UpdatedNodes';
const SECTION_CREATED_EDGES = 'CreatedEdges';

export async function generateLocalMutationByAlgorithm(options: {
	runId?: string;
	command: string;
	targetNode: Node;
	neighborNodes?: Node[];
	existingEdges?: Edge[];
	universe?: {
		name: string;
		premise?: string;
		constraints?: string[];
	};
	maxNewNodes?: number;
}): Promise<MutationResponse> {
	const {
		runId = crypto.randomUUID(),
		command,
		targetNode,
		neighborNodes = [],
		existingEdges = [],
		universe,
		maxNewNodes = 4
	} = options;

	console.info(
		`[mutation:${runId}] start target=${targetNode.id} neighbors=${neighborNodes.length} edges=${existingEdges.length}`
	);

	const markdown = await runStageWithRetries(
		'ai_mutation',
		() =>
			requestTaleyAIMarkdown({
				prompt: buildMutationPrompt({
					command,
					targetNode,
					neighborNodes,
					existingEdges,
					universe,
					maxNewNodes
				}),
				formatInstruction:
					'Return ONLY markdown with these sections: ## Summary, ## CreatedNodes, ## UpdatedNodes, ## CreatedEdges. Each section must contain exactly one fenced code block with tuple lines only.'
			}),
		runId
	);

	const summary = parseSummary(markdown);
	const createdNodes = parseCreatedNodes(markdown);
	const updatedNodes = parseUpdatedNodes(markdown, targetNode, neighborNodes);
	const createdEdges = parseCreatedEdges(markdown);

	const operations: MutationOperation[] = [
		...createdNodes.map((node) => createNodeOperationSchema.parse({ op: 'create_node', node })),
		...updatedNodes.map((node) =>
			updateNodeOperationSchema.parse({
				op: 'update_node',
				nodeId: node.id,
				patch: {
					name: node.name,
					description: node.description,
					payload: node.payload
				}
			})
		),
		...createdEdges.map((edge) => createEdgeOperationSchema.parse({ op: 'create_edge', edge }))
	];

	const affectedNodeIds = new Set<string>([targetNode.id]);
	for (const node of createdNodes) {
		affectedNodeIds.add(node.id);
	}
	for (const node of updatedNodes) {
		affectedNodeIds.add(node.id);
	}
	for (const edge of createdEdges) {
		affectedNodeIds.add(edge.source);
		affectedNodeIds.add(edge.target);
	}

	const response = mutationResponseSchema.parse({
		summary,
		affectedNodeIds: [...affectedNodeIds],
		createdNodes,
		updatedNodes,
		createdEdges,
		warnings: [],
		operations
	});

	console.info(
		`[mutation:${runId}] done createdNodes=${response.createdNodes.length} updatedNodes=${response.updatedNodes.length} createdEdges=${response.createdEdges.length}`
	);

	return response;
}

function buildMutationPrompt(options: {
	command: string;
	targetNode: Node;
	neighborNodes: Node[];
	existingEdges: Edge[];
	universe?: {
		name: string;
		premise?: string;
		constraints?: string[];
	};
	maxNewNodes: number;
}): string {
	const { command, targetNode, neighborNodes, existingEdges, universe, maxNewNodes } = options;
	const contextNodes = [targetNode, ...neighborNodes];

	return [
		universe ? `Universe name: ${universe.name}` : 'Universe name: Unknown',
		universe?.premise ? `Universe premise: ${universe.premise}` : 'Universe premise: Unknown',
		universe?.constraints?.length
			? `Universe constraints: ${JSON.stringify(universe.constraints)}`
			: 'Universe constraints: []',
		`User mutation command: ${command}`,
		`Target node: ${JSON.stringify(targetNode)}`,
		`Context nodes: ${JSON.stringify(contextNodes)}`,
		`Context edges: ${JSON.stringify(existingEdges)}`,
		`Max new nodes: ${maxNewNodes}`,
		'Produce a local mutation only. Do not rewrite unrelated nodes.',
		'CreatedNodes tuples format: [id, name, category, description, payloadObject].',
		'UpdatedNodes tuples format: [id, patchObject] where patchObject may include name, description, payload.',
		'CreatedEdges tuples format: [source, target, visual_nature_or_null, relational_context_or_null].',
		'Summary section must contain exactly one tuple line: [summaryText].',
		'Use valid JSON syntax in tuples. No prose inside code blocks.'
	].join('\n');
}

function parseSummary(markdown: string): string {
	const tuples = extractSectionArrayTuples(markdown, SECTION_SUMMARY);
	if (tuples.length !== 1) {
		throw new Error(`Section ${SECTION_SUMMARY} must contain exactly one tuple line`);
	}
	const first = tuples[0];
	if (!Array.isArray(first) || typeof first[0] !== 'string' || first.length !== 1) {
		throw new Error(`Section ${SECTION_SUMMARY} tuple must be [summaryText]`);
	}
	return first[0];
}

function parseCreatedNodes(markdown: string): Node[] {
	const tuples = extractOptionalSectionArrayTuples(markdown, SECTION_CREATED_NODES);
	return tuples.map((tuple, index) => {
		if (!Array.isArray(tuple) || tuple.length !== 5) {
			throw new Error(`Section ${SECTION_CREATED_NODES} tuple ${index + 1} must be [id,name,category,description,payloadObject]`);
		}
		const [id, name, category, description, payload] = tuple;
		return createNodeOperationSchema.parse({
			op: 'create_node',
			node: {
				id,
				name,
				category,
				description,
				payload
			}
		}).node;
	});
}

function parseUpdatedNodes(markdown: string, targetNode: Node, neighborNodes: Node[]): Node[] {
	const known = new Map<string, Node>();
	known.set(targetNode.id, targetNode);
	for (const node of neighborNodes) {
		known.set(node.id, node);
	}
	const tuples = extractOptionalSectionArrayTuples(markdown, SECTION_UPDATED_NODES);

	return tuples.map((tuple, index) => {
		if (!Array.isArray(tuple) || tuple.length !== 2) {
			throw new Error(`Section ${SECTION_UPDATED_NODES} tuple ${index + 1} must be [id,patchObject]`);
		}
		const [nodeId, patch] = tuple;
		const validated = updateNodeOperationSchema.parse({ op: 'update_node', nodeId, patch });
		const current = known.get(validated.nodeId);
		if (!current) {
			throw new Error(`Section ${SECTION_UPDATED_NODES} references unknown node: ${validated.nodeId}`);
		}

		const merged = {
			...current,
			...(validated.patch.name !== undefined ? { name: validated.patch.name } : {}),
			...(validated.patch.description !== undefined ? { description: validated.patch.description } : {}),
			...(validated.patch.payload !== undefined ? { payload: validated.patch.payload } : {})
		};

		return nodeSchema.parse(merged);
	});
}

function parseCreatedEdges(markdown: string): Edge[] {
	const tuples = extractOptionalSectionArrayTuples(markdown, SECTION_CREATED_EDGES);
	return tuples.map((tuple, index) => {
		if (!Array.isArray(tuple) || tuple.length !== 4) {
			throw new Error(`Section ${SECTION_CREATED_EDGES} tuple ${index + 1} must be [source,target,visual_nature_or_null,relational_context_or_null]`);
		}
		const [source, target, visualNature, relationalContext] = tuple;
		return createEdgeOperationSchema.parse({
			op: 'create_edge',
			edge: {
				source,
				target,
				...(visualNature ? { visual_nature: visualNature } : {}),
				...(relationalContext ? { relational_context: relationalContext } : {})
			}
		}).edge;
	});
}

function extractOptionalSectionArrayTuples(markdown: string, sectionName: string): unknown[] {
	try {
		return extractSectionArrayTuples(markdown, sectionName);
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : String(error);
		if (message.includes(`Missing markdown section: ${sectionName}`)) {
			return [];
		}
		throw error;
	}
}

async function runStageWithRetries<T>(stage: string, run: () => Promise<T>, runId: string): Promise<T> {
	let lastError: unknown;

	for (let attempt = 1; attempt <= STAGE_RETRY_ATTEMPTS; attempt++) {
		const startedAt = Date.now();
		try {
			const result = await run();
			console.info(
				`[mutation:${runId}] stage=${stage} attempt=${attempt} status=ok durationMs=${Date.now() - startedAt}`
			);
			return result;
		} catch (error: unknown) {
			lastError = error;
			const message = error instanceof Error ? error.message : String(error);
			console.warn(
				`[mutation:${runId}] stage=${stage} attempt=${attempt} status=error durationMs=${Date.now() - startedAt} message=${message}`
			);
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
