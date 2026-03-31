import { z } from 'zod';

export const characterPayloadSchema = z.object({
	identity: z.object({
		name: z.string(),
		age: z.string().or(z.number()),
		species: z.string(),
		gender: z.string()
	}),
	appearance: z.object({
		description: z.string(),
		clothing: z.string(),
		modifications: z.string()
	}),
	psychology: z.object({
		mbti: z.string(),
		enneagram: z.string(),
		big5: z.object({
			openness: z.number().min(1).max(100),
			conscientiousness: z.number().min(1).max(100),
			extraversion: z.number().min(1).max(100),
			agreeableness: z.number().min(1).max(100),
			neuroticism: z.number().min(1).max(100)
		}),
		moral_alignment: z.string()
	}),
	biography: z.string(),
	dynamic_attributes: z.array(z.string())
});

export const genericPayloadSchema = z.object({
	description: z.string(),
	dynamic_attributes: z.array(z.string())
});

export type CharacterPayload = z.infer<typeof characterPayloadSchema>;
export type GenericPayload = z.infer<typeof genericPayloadSchema>;
