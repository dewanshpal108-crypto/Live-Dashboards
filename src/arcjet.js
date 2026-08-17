import arcjet, { detectBot, shield, slidingWindow } from "@arcjet/node";

const ARCJET_KEY = process.env.ARCJET_KEY;
const ARCJET_MODE = process.env.ARCJET_MODE === "DRY_RUN" ? "DRY_RUN" : "LIVE"

if(!ARCJET_KEY) {throw new Error("Arcjet_key is missing")};

const httpArcjet =  ARCJET_KEY ? arcjet({
    key:ARCJET_KEY,
    rules:[
        shield({mode: ARCJET_MODE}),
        detectBot({mode: ARCJET_MODE , allow:["CATEGORY:SEARCH_ENGINE" , "CATEGORY:PREVIEW"]}),
        slidingWindow({
            mode : ARCJET_MODE,
            interval : '10s',
            max: 50
        })
    ],
}) : null

export const wsArcjet = ARCJET_KEY ? arcjet({
    key:ARCJET_KEY,
    rules:[
        shield({mode: ARCJET_MODE}),
        detectBot({mode: ARCJET_MODE , allow:["CATEGORY:SEARCH_ENGINE" , "CATEGORY:PREVIEW"]}),
        slidingWindow({
            mode : ARCJET_MODE,
            interval : '2s',
            max: 5
        })
    ],
}) : null

export function securityMiddleware(){
    return (req, res , next) => {
        if(!httpArcjet) return next();

        try{
            const decision = httpArcjet.protect(req);
            if(decision.isDenied())
            {
                if(decision.reason.isRateLimit())
                {
                    return res.status(429).json({error:"Too many requests"})
                }

                return res.status(403).json({error:"forbidden"})
            }
        }catch(e)
        {
            console.error('Arcjet middleware error : ', e);
            return res.status(503).json({error: 'Service Unavailable'})
        }

        next();
    }
}