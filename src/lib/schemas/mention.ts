import { z } from 'zod';

export const mentionTokenSchema = z.object({
	categoryInitial: z.string().length(1),
	name: z.string().min(1),
	rawToken: z.string().min(3),
	offset: z.number().int().nonnegative()
});

export const mentionRecordSchema = mentionTokenSchema.extend({
	sourceNodeId: z.string(),
	normalizedName: z.string().min(1)
});

export type MentionToken = z.infer<typeof mentionTokenSchema>;
export type MentionRecord = z.infer<typeof mentionRecordSchema>;
