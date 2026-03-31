import { z } from 'zod';

export const edgeSchema = z.object({
	source: z.string(),
	target: z.string(),
	visual_nature: z
		.enum(['Positive', 'Negative', 'Hierarchical', 'Neutral', 'Belonging'])
		.optional(),
	relational_context: z.string().optional()
});

export type Edge = z.infer<typeof edgeSchema>;
