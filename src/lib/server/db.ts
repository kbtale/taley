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

export { db };
