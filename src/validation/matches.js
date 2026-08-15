import {z} from 'zod';

export const Match_status = {
    SCHEDULED: 'scheduled',
    LIVE: 'live',
    FINISHED: 'finished',
}

export const listMatchesQuerySchema = z.object({
    limit: z.coerce.number().int().positive().max(100).optional(),
});

export const matchIdParamSchema = z.object({
    id: z.coerce.number().int().positive(),
});

const isoDateString = z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid ISO date string',
});

export const createMatchSchema = z.object({
    homeTeam: z.string().min(1, 'Home team name is required'),
    awayTeam: z.string().min(1, 'Away team name is required'),
    sport: z.string().min(1, 'Sport is required'),
    startTime: isoDateString,
    endTime: isoDateString,
    status: z.enum([Match_status.SCHEDULED, Match_status.LIVE, Match_status.FINISHED]).optional(),
    homeScore: z.coerce.number().int().nonnegative().optional(),
    awayScore: z.coerce.number().int().nonnegative().optional(),
}).superRefine((data, ctx) => {
    if (data.startTime && data.endTime) {
        const start = new Date(data.startTime);
        const end = new Date(data.endTime);
        if (end <= start) {
            ctx.addIssue({
                path: ['endTime'],
                message: 'End time must be after start time',
            });
        }
    }
});

export const updateScoreSchema = z.object({
    homeScore: z.coerce.number().int().nonnegative(),
    awayScore: z.coerce.number().int().nonnegative(),
});
