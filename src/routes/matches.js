import {Router} from 'express';
import { createMatchSchema } from '../validation/matches.js';
import {listMatchesQuerySchema} from '../validation/matches.js';
import { matches } from '../db/schema.js';
import { db } from '../db/db.js';
import { getMatchStatus } from '../utils/match-status.js';
import { desc } from 'drizzle-orm';

 const matchesRouter =  Router();

matchesRouter.get('/', (req, res) => {
    const { limit } = listMatchesQuerySchema.safeParse(req.query).data;
    db.select().from(matches).orderBy(desc(matches.createdAt)).limit(limit).then((data) => {
        res.status(200).json({ message: 'Fetching matches...' , data: data });
    }).catch((error) => {
        res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    });
});

matchesRouter.post('/', async (req, res) => {
    const parsed = createMatchSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid Payload', details:JSON.stringify(parsed.error)});
    }
    const {data: {startTime , endTime , homeScore , awayScore}} = parsed;

    // console.log("Parsed Data: ", parsed.data);

    try{
        //inserting the match in db
        const [newMatch] = await db.insert(matches).values({
            ...parsed.data,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            homeScore: homeScore ?? 0,
            awayScore: awayScore ?? 0,
            status:getMatchStatus(startTime , endTime),
        }).returning();

        if(res.app.locals.broadcastMatches)
        {
            res.app.locals.broadcastMatches(newMatch);
        }

        res.status(201).json({ message: 'Match created successfully' , data : newMatch });
    }catch(error)
    {
        res.status(500).json({error:"Internal Server Error" , detail: error.message});
    }

});


export default matchesRouter;