import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateUniverseByAlgorithm } from '$lib/server/generation/orchestrator';
import { persistUniverseSeed } from '$lib/server/db';

export const POST: RequestHandler = async ({ request }) => {
	const { premise, complexity = 'medium' } = await request.json();

	if (!premise) {
		return json({ error: 'Premise is required' }, { status: 400 });
	}

	try {
		const seedData = await generateUniverseByAlgorithm({ premise, complexity });

		const { universeId } = await persistUniverseSeed(seedData);

		return json({
			universeId,
			...seedData
		});
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'Unknown error';
		console.error('Synthesis Error:', err);
		return json({ 
			error: 'Failed to generate universe', 
			message
		}, { status: 500 });
	}
};
