import { Surreal } from 'surrealdb';
import { SURREAL_URL, SURREAL_USER, SURREAL_PASS, SURREAL_NS, SURREAL_DB } from '$env/static/private';

const db = new Surreal();

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
import type { SeedResponse } from '../schemas/seed.js';

export async function persistUniverseSeed(data: SeedResponse) {
	const db = await getDb();
	const { universe, nodes, edges } = data;

	const universeId = universe.id || `universe:${crypto.randomUUID()}`;
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

	for (const node of nodes) {
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

	for (const edge of edges) {
		await db.query(`
			RELATE ${edge.source}->linked_to->${edge.target} 
			-- SET 
			-- 	visual_nature = $nature,
			-- 	relational_context = $context
		`, {
			// nature: edge.visual_nature,
			// context: edge.relational_context
		});
	}

	return { universeId };
}
