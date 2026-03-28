import { getDb } from '$lib/server/db';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async () => {
	const db = await getDb();
	const status = db.status;
	
	return {
		dbStatus: status
	};
};
