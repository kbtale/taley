import { getDb } from '$lib/server/db';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async () => {
	try {
		const db = await getDb();
		return {
			dbStatus: db.status
		};
	} catch (error) {
		return {
			dbStatus: 'disconnected'
		};
	}
};
