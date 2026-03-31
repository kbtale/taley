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

export const generationMarkdownSectionSchema = z.enum([
	'Universe',
	'Locations',
	'Collectives',
	'Events',
	'Phenomena',
	'Concepts',
	'Artifacts',
	'Characters',
	'Connections'
]);

export const generationMarkdownSectionOrder = [
	'Universe',
	'Locations',
	'Collectives',
	'Events',
	'Phenomena',
	'Concepts',
	'Artifacts',
	'Characters',
	'Connections'
] as const satisfies readonly z.infer<typeof generationMarkdownSectionSchema>[];

export const universeMetadataSchema = universeSchema.pick({
	id: true,
	name: true,
	seed_premise: true,
	constraints: true
});

export const universeMetadataTupleSchema = z.tuple([
	z.string(),
	z.string(),
	z.array(z.string())
]);

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

export const environmentNodeTupleSchema = z.tuple([
	z.string(),
	z.string(),
	z.array(z.string())
]);

export const characterNodeTupleSchema = z.tuple([
	z.string(),
	z.string(),
	z.string(),
	z.string().or(z.number()),
	z.string(),
	z.string(),
	z.string(),
	z.string(),
	z.string(),
	z.string(),
	z.string(),
	z.number().min(1).max(100),
	z.number().min(1).max(100),
	z.number().min(1).max(100),
	z.number().min(1).max(100),
	z.number().min(1).max(100),
	z.string(),
	z.string(),
	z.array(z.string())
]);

export const environmentBatchTupleSchema = z.array(environmentNodeTupleSchema);
export const characterBatchTupleSchema = z.array(characterNodeTupleSchema);

export type EnvironmentCategory = z.infer<typeof environmentCategorySchema>;
export type GenerationComplexity = z.infer<typeof generationComplexitySchema>;
export type GenerationMarkdownSection = z.infer<typeof generationMarkdownSectionSchema>;
export type UniverseMetadata = z.infer<typeof universeMetadataSchema>;
export type UniverseMetadataTuple = z.infer<typeof universeMetadataTupleSchema>;
export type EnvironmentBatch = z.infer<typeof environmentBatchSchema>;
export type CharacterBatch = z.infer<typeof characterBatchSchema>;
export type EnvironmentNodeTuple = z.infer<typeof environmentNodeTupleSchema>;
export type CharacterNodeTuple = z.infer<typeof characterNodeTupleSchema>;
