import { z } from 'zod';

export const universeSchema = z.object({
	id: z.string(),
	name: z.string(),
	seed_premise: z.string()
});

export type Universe = z.infer<typeof universeSchema>;
