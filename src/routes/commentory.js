import { Router } from "express";
import { db } from "../db/db.js";
import { commentary } from "../db/schema.js";
import { matchParamSchema } from "../validation/matches.js";
import { commentorySchema } from "../validation/commentary.js";
import { listCommentary } from "../validation/commentary.js";

export const commentoryRouter = Router();

commentoryRouter.get('/:id', async (req, res) => {
    const {limit} = listCommentary.safeParse(req.query).data;
    await db.select().from(commentary).orderBy(commentary.createdAt).limit(limit).then(data => res.status(200).json({ message: 'Fetching Commentary...' , data: data })).catch((error) => {
        res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    });
});

commentoryRouter.post('/:id', async (req, res) => {
    // console.log(req);
    const paramsResult = matchParamSchema.safeParse(req.params);
    
    if (!paramsResult.success) {
        return res.status(400).json({
            error: 'Invalid match id',
            details: paramsResult.error.issues,
        });
    }

    const bodyResult = commentorySchema.safeParse(req.body);
    if (!bodyResult.success) {
        return res.status(400).json({
            error: 'Invalid commentary payload',
            details: bodyResult.error.issues,
        });
    }

    try {
        const [newCommentary] = await db
            .insert(commentary)
            .values({
                ...bodyResult.data,
                matchId: Number(paramsResult.data.id),
            })
            .returning();

        return res.status(201).json({
            message: 'Commentary created successfully',
            data: newCommentary,
        });
    } catch (error) {
        return res.status(500).json({
            error: 'Internal Server Error',
            detail: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});