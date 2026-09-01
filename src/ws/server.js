import { WebSocket, WebSocketServer } from "ws";
import { wsArcjet } from "../arcjet.js";

const matchSubscribers = new Map();

function subscribe(matchId , socket)
{
    if(!matchSubscribers.has(matchId)){matchSubscribers.set(matchId , new Set())}

    if(matchSubscribers.get(matchId).has(socket)){console.log("socket is already subscribed")}
    else{matchSubscribers.get(matchId).add(socket)}
    
}

function unsubscribe(matchId,socket)
{
    if(matchSubscribers.has(matchId))
    {
        //subscriber -> set
        const subscribers = matchSubscribers.get(matchId);

        if(!subscribers){return}

        
        if(subscribers.has(socket)){subscribers.delete(socket)}
        else{console.log("socket is already unsubscribed")}
        
        if(subscribers.size==0){matchSubscribers.delete(matchId)}
    }
    else{
        console.log("matchId is not present")
    }
}

function cleanupSubscription(socket)
{
    for(const matchId of socket.subscriptions)
    {
        unsubscribe(matchId ,socket);
    }
}

function sendMessage(payload, socket) {
    if (socket.readyState !== WebSocket.OPEN) {
        console.error("Socket is not open. Cannot send message.");
        return;
    }
    
    socket.send(JSON.stringify(payload));
}

function broadcastMessageToAll(wss, payload) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(payload));
        }
    });
}

function broadcastMessageToMatch(matchId , payload)
{   
    if(matchSubscribers.has(matchId))
    {
        const subscribers = matchSubscribers.get(matchId)

        if(!subscribers || subscribers.size==0) return ;

        const message = JSON.stringify(payload);

        subscribers.forEach((socket)=>{
            if(socket.readyState === WebSocket.OPEN)
            {
                socket.send(message);
            }
        })
    }else
    {
        console.log("matchId not present");
    }
}

function handleMessage(socket,data)
{
    let message;
    try{
        message = JSON.parse(data.toString());
    } catch{
        sendMessage({type : 'error' , message : 'Invalid Json'} , socket)
    }

    if(message?.type === "subscribe" && Number.isInteger(message.matchId))
    {
        subscribe(message.matchId , socket);
        socket.subscriptions.add(message.matchId);
        sendMessage({type: 'subscribed' , matchId : message.matchId} , socket)
        return
    }

     if(message?.type === "unsubscribe" && Number.isInteger(message.matchId))
    {
        unsubscribe(message.matchId , socket);
        socket.subscriptions.add(message.matchId);
        sendMessage({type: 'unsubscribed' , matchId : message.matchId} , socket)
        return
    }
}

export function setupWebSocketServer(server) {
    const wss = new WebSocketServer({
        server,
        path: "/ws",
        maxPayload: 1024 * 1024
    });

    wss.on("connection", async (ws , req) => {
        ws.subscriptions = new Set();

        if(wsArcjet)
        {
            try{
                const decision = await wsArcjet.protect(req);

                if(decision.isDenied())
                {
                    const code = decision.reason.isRateLimit() ? '1013' : '1008';
                    const Reason = decision.reason.isRateLimit() ? 'Rate limit exceeded' : 'Access Denied';

                    console.error("ws server precluded")
                    ws.close(code , Reason);
                    return;
                }
            }catch(e)
            {
                console.error('Arcjet error in ws')
                ws.close(1011 , 'Server security compromised');
                return;
            }
        }

        console.log("✅ WebSocket connected");

        sendMessage(
            {
                type: "connection",
                message: "Welcome to the WebSocket server!"
            },
            ws
        );

        ws.on("message",(data)=>{
            handleMessage(ws,data);
        })

        ws.on("error", (error) => {
            ws.terminate();
        });

        ws.on("close", () => {
            cleanupSubscription(ws)
            console.log("❌ WebSocket disconnected");
        });
    });

    function broadcastMatches(match) {
        broadcastMessageToAll(wss, {
            type: "match_broadcasted",
            data: match
        });
    }

    function broadcastCommentory(matchId , comment)
    {
        broadcastMessageToMatch(matchId , {type:'commentory' , data: comment});
    }

    return {
        broadcastMatches , broadcastCommentory 
    };
}