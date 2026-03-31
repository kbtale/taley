import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { mutationRequestSchema } from '$lib/schemas/mutation.js';
import { nodeSchema, type Node } from '$lib/schemas/node.js';
import { edgeSchema, type Edge } from '$lib/schemas/edge.js';
import { universeSchema } from '$lib/schemas/universe.js';
import { generateLocalMutationByAlgorithm } from '$lib/server/generation/mutation-orchestrator.js';
import { getDb, persistLocalMutation } from '$lib/server/db';

export const POST: RequestHandler = async ({ request }) => {
	const runId = crypto.randomUUID();
	const body = await parseJsonBody(request, runId);
	if (body.errorResponse) {
		return body.errorResponse;
	}

	const parsed = mutationRequestSchema.safeParse(body.value);
	if (!parsed.success) {
		return json(
			{
				runId,
				error: 'Invalid mutation request',
				message: 'Request body did not match mutation schema.',
				issues: parsed.error.issues
			},
			{ status: 400 }
		);
	}

	const payload = parsed.data;

	try {
		const context = await buildMutationContext(payload.targetNodeId);
		if (!context) {
			return json(
				{
					runId,
					error: 'Target node not found',
					message: `No node exists for targetNodeId: ${payload.targetNodeId}`
				},
				{ status: 404 }
			);
		}

		const mutation = await generateLocalMutationByAlgorithm({
			runId,
			command: payload.command,
			targetNode: context.targetNode,
			neighborNodes: context.neighborNodes,
			existingEdges: context.existingEdges,
			universe: context.universe,
			maxNewNodes: payload.maxNewNodes
		});

		if (!context.universeId) {
			return json(
				{
					runId,
					error: 'Missing universe relation',
					message: `Target node ${payload.targetNodeId} has no universe relation.`
				},
				{ status: 500 }
			);
		}

		await persistLocalMutation({
			universeId: context.universeId,
			mutation
		});

		return json(
			{
				runId,
				persisted: true,
				mutation
			},
			{ status: 200 }
		);
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'Unknown error';
		console.error(`Mutation Error [${runId}]:`, err);
		return json(
			{
				runId,
				error: 'Failed to process mutation request',
				message
			},
			{ status: 500 }
		);
	}
};

type JsonBodyResult =
	| { value: unknown; errorResponse?: undefined }
	| { value?: undefined; errorResponse: Response };

async function parseJsonBody(request: Request, runId: string): Promise<JsonBodyResult> {
	try {
		return { value: await request.json() };
	} catch {
		return {
			errorResponse: json(
				{
					runId,
					error: 'Invalid JSON body',
					message: 'Request body must be valid JSON.'
				},
				{ status: 400 }
			)
		};
	}
}

async function buildMutationContext(nodeId: string): Promise<{
	targetNode: Node;
	neighborNodes: Node[];
	existingEdges: Edge[];
	universeId?: string;
	universe?: { name: string; premise?: string; constraints?: string[] };
} | null> {
	const db = await getDb();
	const targetRows = extractRows(await db.query('SELECT * FROM type::record($id);', { id: nodeId }));
	if (targetRows.length === 0) {
		return null;
	}

	const targetRaw = targetRows[0];
	const targetNode = toNode(targetRaw);
	const universeId =
		targetRaw && typeof targetRaw === 'object'
			? extractRecordId((targetRaw as { universe?: unknown }).universe) ?? undefined
			: undefined;
	const edgeRows = extractRows(
		await db.query(
			`SELECT in, out, visual_nature, relational_context
			 FROM linked_to
			 WHERE in = type::record($id) OR out = type::record($id)
			 LIMIT $limit;`,
			{ id: nodeId, limit: 40 }
		)
	);

	const existingEdges = edgeRows
		.map((row) => toEdge(row))
		.filter((edge): edge is Edge => edge !== null);

	const neighborIdSet = new Set<string>();
	for (const edge of existingEdges) {
		if (edge.source !== targetNode.id) {
			neighborIdSet.add(edge.source);
		}
		if (edge.target !== targetNode.id) {
			neighborIdSet.add(edge.target);
		}
	}

	const neighborNodes: Node[] = [];
	for (const neighborId of neighborIdSet) {
		const rows = extractRows(await db.query('SELECT * FROM type::record($id);', { id: neighborId }));
		if (rows.length === 0) {
			continue;
		}
		neighborNodes.push(toNode(rows[0]));
	}

	const universe = await fetchUniverseFromRow(targetRaw);

	return {
		targetNode,
		neighborNodes,
		existingEdges,
		universeId,
		universe
	};
}

async function fetchUniverseFromRow(row: unknown): Promise<{ name: string; premise?: string; constraints?: string[] } | undefined> {
	const universeRecord =
		row && typeof row === 'object'
			? extractRecordId((row as { universe?: unknown }).universe)
			: null;
	if (!universeRecord) {
		return undefined;
	}

	const db = await getDb();
	const rows = extractRows(await db.query('SELECT * FROM type::record($id);', { id: universeRecord }));
	if (rows.length === 0) {
		return undefined;
	}

	const parsed = universeSchema.parse(toSerializableRecord(rows[0]));
	return {
		name: parsed.name,
		premise: parsed.seed_premise,
		constraints: parsed.constraints
	};
}

function toNode(value: unknown): Node {
	return nodeSchema.parse(toSerializableRecord(value));
}

function toEdge(value: unknown): Edge | null {
	if (!value || typeof value !== 'object') {
		return null;
	}
	const row = value as { in?: unknown; out?: unknown; visual_nature?: unknown; relational_context?: unknown };
	const source = extractRecordId(row.in);
	const target = extractRecordId(row.out);
	if (!source || !target) {
		return null;
	}

	return edgeSchema.parse({
		source,
		target,
		...(typeof row.visual_nature === 'string' ? { visual_nature: row.visual_nature } : {}),
		...(typeof row.relational_context === 'string' ? { relational_context: row.relational_context } : {})
	});
}

function toSerializableRecord(value: unknown): unknown {
	if (Array.isArray(value)) {
		return value.map(toSerializableRecord);
	}

	if (!value || typeof value !== 'object') {
		return value;
	}

	const thingId = extractRecordId(value);
	if (thingId) {
		return thingId;
	}

	const output: Record<string, unknown> = {};
	for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
		output[key] = toSerializableRecord(nested);
	}
	return output;
}

function extractRecordId(value: unknown): string | null {
	if (typeof value === 'string') {
		return value;
	}
	if (!value || typeof value !== 'object') {
		return null;
	}
	const thing = value as { tb?: unknown; id?: unknown };
	if (typeof thing.tb === 'string' && (typeof thing.id === 'string' || typeof thing.id === 'number')) {
		return `${thing.tb}:${thing.id}`;
	}
	return null;
}

function extractRows(result: unknown): unknown[] {
	if (!Array.isArray(result)) {
		return [];
	}

	const first = result[0];
	if (!first || typeof first !== 'object') {
		return [];
	}

	const statementResult = (first as { result?: unknown }).result;
	if (Array.isArray(statementResult)) {
		return statementResult;
	}

	return [];
}
