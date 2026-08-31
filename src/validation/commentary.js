import { z } from "zod";

export const listCommentary = z.object({
    limit: z.coerce.number().int().positive().max(100).optional(),
});

export const commentarySchema = z.object({
    minute: z.number().int().optional(),
    actor: z.string().optional(),
    period: z.string().optional(),
    eventType: z.string().optional(),
    message: z.string().min(1, "Message is required"),
    team: z.string().optional(),
    sequenceNo: z.number().int().optional(),
    metaData: z.record(z.string(), z.any()).optional(),
    tags: z.array(z.string()).optional(),
});

export const commentorySchema = commentarySchema;
