import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { mutationRequestSchema } from '$lib/schemas/mutation.js';
import { getDb } from '$lib/server/db';

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
		const exists = await hasNode(payload.targetNodeId);
		if (!exists) {
			return json(
				{
					runId,
					error: 'Target node not found',
					message: `No node exists for targetNodeId: ${payload.targetNodeId}`
				},
				{ status: 404 }
			);
		}

		return json(
			{
				runId,
				error: 'Mutation endpoint not implemented',
				message: 'Endpoint contract and validation are ready. Orchestration and persistence will be added in the next task.'
			},
			{ status: 501 }
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

async function hasNode(nodeId: string): Promise<boolean> {
	const db = await getDb();
	const result = await db.query('SELECT id FROM type::record($id);', { id: nodeId });
	const rows = extractRows(result);
	return rows.length > 0;
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
