import { z } from 'zod';
import { universeSchema } from './universe.js';
import { nodeSchema } from './node.js';
import { edgeSchema } from './edge.js';

export const seedResponseSchema = z.object({
	universe: universeSchema,
	nodes: z.array(nodeSchema),
	edges: z.array(edgeSchema)
});

export type SeedResponse = z.infer<typeof seedResponseSchema>;
