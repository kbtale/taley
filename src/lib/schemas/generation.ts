import { z } from 'zod';
import { universeSchema } from './universe.js';
import { nodeSchema } from './node.js';

export const environmentCategorySchema = z.enum([
	'Location',
	'Collective',
	'Event',
	'Phenomenon',
	'Concept',
	'Artifact'
]);

export const generationComplexitySchema = z.enum(['low', 'medium', 'high']);

export const universeMetadataSchema = universeSchema.pick({
	id: true,
	name: true,
	seed_premise: true,
	constraints: true
});

export const environmentNodeSchema = nodeSchema.refine(
	(node) => node.category !== 'Character' && node.category !== 'Unknown',
	'Environment nodes must be one of: Location, Collective, Event, Phenomenon, Concept, Artifact.'
);

export const characterNodeSchema = nodeSchema.refine(
	(node) => node.category === 'Character',
	'Character batch must contain only Character nodes.'
);

export const environmentBatchSchema = z.object({
	nodes: z.array(environmentNodeSchema)
});

export const characterBatchSchema = z.object({
	nodes: z.array(characterNodeSchema)
});

export type EnvironmentCategory = z.infer<typeof environmentCategorySchema>;
export type GenerationComplexity = z.infer<typeof generationComplexitySchema>;
export type UniverseMetadata = z.infer<typeof universeMetadataSchema>;
export type EnvironmentBatch = z.infer<typeof environmentBatchSchema>;
export type CharacterBatch = z.infer<typeof characterBatchSchema>;
