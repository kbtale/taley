import { z } from 'zod';
import { biologicalPayloadSchema, genericPayloadSchema } from './payload';

const baseNodeSchema = z.object({
	id: z.string(),
	name: z.string()
});

export const nodeSchema = z.discriminatedUnion('category', [
	baseNodeSchema.extend({
		category: z.literal('Biological Entity'),
		payload: biologicalPayloadSchema
	}),
	baseNodeSchema.extend({
		category: z.literal('Collective'),
		payload: genericPayloadSchema
	}),
	baseNodeSchema.extend({
		category: z.literal('Location'),
		payload: genericPayloadSchema
	}),
	baseNodeSchema.extend({
		category: z.literal('Event'),
		payload: genericPayloadSchema
	}),
	baseNodeSchema.extend({
		category: z.literal('Artifact'),
		payload: genericPayloadSchema
	}),
	baseNodeSchema.extend({
		category: z.literal('Concept'),
		payload: genericPayloadSchema
	}),
	baseNodeSchema.extend({
		category: z.literal('Phenomenon'),
		payload: genericPayloadSchema
	})
]);

export type Node = z.infer<typeof nodeSchema>;
