import { z } from 'zod';
import { nodeSchema } from './node.js';
import { edgeSchema } from './edge.js';

export const mutationRequestSchema = z
	.object({
		targetNodeId: z.string().min(1),
		command: z.string().min(1),
		constraints: z.array(z.string()).optional(),
		maxNewNodes: z.number().int().min(0).max(25).optional()
	})
	.strict();

export const mutationWarningSchema = z
	.object({
		code: z.string().min(1),
		message: z.string().min(1)
	})
	.strict();

const nodePatchSchema = z
	.object({
		name: z.string().min(1).optional(),
		description: z.string().min(1).optional(),
		payload: z.record(z.string(), z.unknown()).optional()
	})
	.strict()
	.refine((patch) => patch.name !== undefined || patch.description !== undefined || patch.payload !== undefined, {
		message: 'Node patch must include at least one field.'
	});

export const createNodeOperationSchema = z
	.object({
		op: z.literal('create_node'),
		node: nodeSchema
	})
	.strict();

export const updateNodeOperationSchema = z
	.object({
		op: z.literal('update_node'),
		nodeId: z.string().min(1),
		patch: nodePatchSchema
	})
	.strict();

export const createEdgeOperationSchema = z
	.object({
		op: z.literal('create_edge'),
		edge: edgeSchema
	})
	.strict();

export const deleteNodeOperationSchema = z
	.object({
		op: z.literal('delete_node'),
		nodeId: z.string().min(1)
	})
	.strict();

export const deleteEdgeOperationSchema = z
	.object({
		op: z.literal('delete_edge'),
		edge: edgeSchema.pick({ source: true, target: true })
	})
	.strict();

export const mutationOperationSchema = z.discriminatedUnion('op', [
	createNodeOperationSchema,
	updateNodeOperationSchema,
	createEdgeOperationSchema,
	deleteNodeOperationSchema,
	deleteEdgeOperationSchema
]);

export const mutationResponseSchema = z
	.object({
		summary: z.string().min(1),
		affectedNodeIds: z.array(z.string().min(1)),
		createdNodes: z.array(nodeSchema),
		updatedNodes: z.array(nodeSchema),
		createdEdges: z.array(edgeSchema),
		warnings: z.array(mutationWarningSchema).default([]),
		operations: z.array(mutationOperationSchema)
	})
	.strict();

export type MutationRequest = z.infer<typeof mutationRequestSchema>;
export type MutationWarning = z.infer<typeof mutationWarningSchema>;
export type MutationOperation = z.infer<typeof mutationOperationSchema>;
export type MutationResponse = z.infer<typeof mutationResponseSchema>;
