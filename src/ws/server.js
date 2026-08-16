import { WebSocket, WebSocketServer } from "ws";

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

    wss.on("connection", (ws) => {
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