import { Surreal } from 'surrealdb';
import { SURREAL_URL, SURREAL_USER, SURREAL_PASS, SURREAL_NS, SURREAL_DB } from '$env/static/private';
import type { SeedResponse } from '../schemas/seed.js';
import type { MutationResponse } from '../schemas/mutation.js';

const db = new Surreal();
const RECORD_ID_PATTERN = /^[a-z_][a-z0-9_]*:[a-z0-9._:-]+$/i;

export async function getDb() {
	if (db.status !== 'connected') {
		try {
			await db.connect(SURREAL_URL, {
				authentication: {
					username: SURREAL_USER,
					password: SURREAL_PASS
				},
				namespace: SURREAL_NS,
				database: SURREAL_DB
			});
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : String(error);
			if (/namespace|database/i.test(message) && /does not exist/i.test(message)) {
				throw new Error(
					`Database scope ${SURREAL_NS}/${SURREAL_DB} is missing. Run: bun run db:bootstrap`
				);
			}
			throw error;
		}
	}
	return db;
}

export async function persistUniverseSeed(data: SeedResponse) {
	const db = await getDb();
	const { universe, nodes, edges } = data;

	const universeId = universe.id || `universe:${crypto.randomUUID()}`;
	assertRecordId(universeId, 'universe.id');

	const uniqueNodes = new Map(nodes.map((node) => [node.id, node]));
	const uniqueEdges = new Map(edges.map((edge) => [`${edge.source}->${edge.target}`, edge]));

	await runQuery(db, `
		UPSERT type::record($id) CONTENT {
			name: $name,
			seed_premise: $premise,
			constraints: $constraints,
			created_at: time::now()
		}
	`, {
		id: universeId,
		name: universe.name,
		premise: universe.seed_premise,
		constraints: universe.constraints || []
	}, 'create_universe');

	for (const node of uniqueNodes.values()) {
		assertRecordId(node.id, 'node.id');
		await runQuery(db, `
			UPSERT type::record($id) CONTENT {
				universe: type::record($universeId),
				name: $name,
				category: $category,
				description: $description,
				payload: $payload,
				position: { x: 0, y: 0 }
			}
		`, {
			id: node.id,
			universeId,
			name: node.name,
			category: node.category,
			description: node.description,
			payload: node.payload || {}
		}, `create_node:${node.id}`);
	}

	for (const edge of uniqueEdges.values()) {
		assertRecordId(edge.source, 'edge.source');
		assertRecordId(edge.target, 'edge.target');
		const visualNature = edge.visual_nature ?? 'Neutral';
		const relationalContext = edge.relational_context ?? 'Auto-generated';
		await runQuery(db, `
			LET $sourceRecord = type::record($source);
			LET $targetRecord = type::record($target);
			RELATE $sourceRecord->linked_to->$targetRecord
				CONTENT {
					universe: type::record($universeId),
					visual_nature: $visualNature,
					relational_context: $relationalContext
				}
		`, {
			source: edge.source,
			target: edge.target,
			universeId,
			visualNature,
			relationalContext
		}, `relate_edge:${edge.source}->${edge.target}`);
	}

	return { universeId };
}

export async function persistLocalMutation(options: {
	universeId: string;
	mutation: MutationResponse;
}) {
	const db = await getDb();
	const { universeId, mutation } = options;
	assertRecordId(universeId, 'universeId');

	const statements: string[] = ['BEGIN TRANSACTION;'];
	const params: Record<string, unknown> = { universeId };

	for (const [index, operation] of mutation.operations.entries()) {
		switch (operation.op) {
			case 'create_node': {
				assertRecordId(operation.node.id, `operations[${index}].node.id`);
				params[`nodeId_${index}`] = operation.node.id;
				params[`nodeName_${index}`] = operation.node.name;
				params[`nodeCategory_${index}`] = operation.node.category;
				params[`nodeDescription_${index}`] = operation.node.description;
				params[`nodePayload_${index}`] = operation.node.payload;
				statements.push(`
					UPSERT type::record($nodeId_${index}) CONTENT {
						universe: type::record($universeId),
						name: $nodeName_${index},
						category: $nodeCategory_${index},
						description: $nodeDescription_${index},
						payload: $nodePayload_${index},
						position: { x: 0, y: 0 }
					};
				`);
				break;
			}
			case 'update_node': {
				assertRecordId(operation.nodeId, `operations[${index}].nodeId`);
				params[`updateNodeId_${index}`] = operation.nodeId;
				params[`updatePatch_${index}`] = operation.patch;
				statements.push(`
					UPDATE type::record($updateNodeId_${index}) MERGE $updatePatch_${index};
				`);
				break;
			}
			case 'create_edge': {
				assertRecordId(operation.edge.source, `operations[${index}].edge.source`);
				assertRecordId(operation.edge.target, `operations[${index}].edge.target`);
				params[`edgeSource_${index}`] = operation.edge.source;
				params[`edgeTarget_${index}`] = operation.edge.target;
				params[`edgeVisualNature_${index}`] = operation.edge.visual_nature ?? 'Neutral';
				params[`edgeContext_${index}`] = operation.edge.relational_context ?? 'Auto-generated';
				statements.push(`
					LET $sourceRecord_${index} = type::record($edgeSource_${index});
					LET $targetRecord_${index} = type::record($edgeTarget_${index});
					RELATE $sourceRecord_${index}->linked_to->$targetRecord_${index}
						CONTENT {
							universe: type::record($universeId),
							visual_nature: $edgeVisualNature_${index},
							relational_context: $edgeContext_${index}
						};
				`);
				break;
			}
			case 'delete_node': {
				assertRecordId(operation.nodeId, `operations[${index}].nodeId`);
				params[`deleteNodeId_${index}`] = operation.nodeId;
				statements.push(`
					DELETE type::record($deleteNodeId_${index});
				`);
				break;
			}
			case 'delete_edge': {
				assertRecordId(operation.edge.source, `operations[${index}].edge.source`);
				assertRecordId(operation.edge.target, `operations[${index}].edge.target`);
				params[`deleteEdgeSource_${index}`] = operation.edge.source;
				params[`deleteEdgeTarget_${index}`] = operation.edge.target;
				statements.push(`
					DELETE linked_to
					WHERE in = type::record($deleteEdgeSource_${index})
					  AND out = type::record($deleteEdgeTarget_${index})
					  AND universe = type::record($universeId);
				`);
				break;
			}
		}
	}

	statements.push('COMMIT TRANSACTION;');

	await runQuery(db, statements.join('\n'), params, 'persist_local_mutation');

	return {
		persisted: true,
		operationCount: mutation.operations.length
	};
}

function assertRecordId(value: string, field: string) {
	if (!RECORD_ID_PATTERN.test(value)) {
		throw new Error(`Invalid record id in ${field}: ${value}`);
	}
}

async function runQuery(
	client: Surreal,
	sql: string,
	params?: Record<string, unknown>,
	operation = 'query'
) {
	try {
		if (params) {
			return await client.query(sql, params);
		}
		return await client.query(sql);
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : String(error);
		throw new Error(`Database operation failed (${operation}): ${message}`);
	}
}
