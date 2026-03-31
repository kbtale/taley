import { Surreal } from 'surrealdb';
import { SURREAL_URL, SURREAL_USER, SURREAL_PASS, SURREAL_NS, SURREAL_DB } from '$env/static/private';
import type { SeedResponse } from '../schemas/seed.js';

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
			title: $name,
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
