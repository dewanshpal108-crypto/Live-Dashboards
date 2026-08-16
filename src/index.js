import express from "express";
import http from 'http'
import matchesRouter from "./routes/matches.js";
import { setupWebSocketServer } from "./ws/server.js";

const PORT = Number(process.env.PORT || 5000);
const HOST = process.env.HOST || '0.0.0.0';

const app = express();
export const server = http.createServer(app);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello from the server!");
});

app.use("/matches", matchesRouter);

const {broadcastMatches} = setupWebSocketServer(server)
app.locals.broadcastMatches = broadcastMatches;


server.listen(PORT, HOST , () => {
  const baseUrl = HOST === '0.0.0.0' ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`
  console.log(`server running on the baseUrl on ${baseUrl}`);
  console.log(`websocket server running on ${baseUrl.replace('http', 'ws')}/ws`)
});