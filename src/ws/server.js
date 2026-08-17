import { WebSocket, WebSocketServer } from "ws";
import { wsArcjet } from "../arcjet.js";

function sendMessage(payload, socket) {
    if (socket.readyState !== WebSocket.OPEN) {
        console.error("Socket is not open. Cannot send message.");
        return;
    }

    socket.send(JSON.stringify(payload));
}

function broadcastMessage(wss, payload) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(payload));
        }
    });
}

export function setupWebSocketServer(server) {
    const wss = new WebSocketServer({
        server,
        path: "/ws",
        maxPayload: 1024 * 1024
    });

    wss.on("connection", async (ws , req) => {
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

        ws.on("error", (error) => {
            console.error("WebSocket error:", error);
        });

        ws.on("close", () => {
            console.log("❌ WebSocket disconnected");
        });
    });

    function broadcastMatches(match) {
        broadcastMessage(wss, {
            type: "match_broadcasted",
            data: match
        });
    }

    return {
        broadcastMatches
    };
}