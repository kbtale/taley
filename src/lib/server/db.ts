import { Surreal } from 'surrealdb';
import { SURREAL_URL, SURREAL_USER, SURREAL_PASS, SURREAL_NS, SURREAL_DB } from '$env/static/private';
import type { SeedResponse } from '../schemas/seed.js';

const db = new Surreal();
const RECORD_ID_PATTERN = /^[a-z_][a-z0-9_]*:[a-z0-9._:-]+$/i;

export async function getDb() {
	if (db.status !== 'connected') {
		await db.connect(SURREAL_URL, {
			authentication: {
				username: SURREAL_USER,
				password: SURREAL_PASS
			},
			namespace: SURREAL_NS,
			database: SURREAL_DB
		});
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

	await db.query(`
		CREATE $id SET 
			name = $name, 
			seed_premise = $premise, 
			constraints = $constraints
	`, {
		id: universeId,
		name: universe.name,
		premise: universe.seed_premise,
		constraints: universe.constraints || []
	});

	for (const node of uniqueNodes.values()) {
		assertRecordId(node.id, 'node.id');
		await db.query(`
			CREATE $id SET 
				name = $name, 
				category = $category, 
				description = $description, 
				payload = $payload, 
				position = { x: 0, y: 0 }
		`, {
			id: node.id,
			name: node.name,
			category: node.category,
			description: node.description,
			payload: node.payload || {}
		});
	}

	for (const edge of uniqueEdges.values()) {
		assertRecordId(edge.source, 'edge.source');
		assertRecordId(edge.target, 'edge.target');
		await db.query(`
			RELATE ${edge.source}->linked_to->${edge.target} 
		`);
	}

	return { universeId };
}

function assertRecordId(value: string, field: string) {
	if (!RECORD_ID_PATTERN.test(value)) {
		throw new Error(`Invalid record id in ${field}: ${value}`);
	}
}
