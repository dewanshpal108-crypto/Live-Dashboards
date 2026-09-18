import 'dotenv/config';
import express from "express";
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import matchesRouter from "./routes/matches.js";
import { setupWebSocketServer } from "./ws/server.js";
import { securityMiddleware } from "./arcjet.js";
import { commentoryRouter } from "./routes/commentory.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../public');

const fallbackPort = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
const PORT = fallbackPort;

const app = express();
export const server = http.createServer(app);

const mockMatches = [
  {
    id: 1,
    homeTeam: 'Mumbai Mavericks',
    awayTeam: 'Delhi Strikers',
    sport: 'Cricket',
    startTime: '2026-09-18T18:30:00.000Z',
    status: 'live',
    homeScore: 186,
    awayScore: 174,
    endTime: '2026-09-18T22:00:00.000Z',
    createdAt: '2026-09-18T18:00:00.000Z'
  },
  {
    id: 2,
    homeTeam: 'City United',
    awayTeam: 'Harbor FC',
    sport: 'Football',
    startTime: '2026-09-18T19:15:00.000Z',
    status: 'scheduled',
    homeScore: 0,
    awayScore: 0,
    endTime: '2026-09-18T20:45:00.000Z',
    createdAt: '2026-09-18T16:45:00.000Z'
  },
  {
    id: 3,
    homeTeam: 'Lunar Kings',
    awayTeam: 'North Blazers',
    sport: 'Basketball',
    startTime: '2026-09-18T17:00:00.000Z',
    status: 'finished',
    homeScore: 112,
    awayScore: 104,
    endTime: '2026-09-18T18:45:00.000Z',
    createdAt: '2026-09-18T15:30:00.000Z'
  }
];

const mockCommentary = {
  1: [
    {
      id: 101,
      matchId: 1,
      minute: 18,
      actor: 'R. Shah',
      period: '1st innings',
      eventType: 'Boundary',
      message: 'R. Shah launches a clean drive over cover for four.',
      team: 'Mumbai Mavericks',
      sequenceNo: 7,
      tags: ['boundary', 'momentum'],
      createdAt: '2026-09-18T18:42:00.000Z'
    },
    {
      id: 102,
      matchId: 1,
      minute: 22,
      actor: 'J. Patel',
      period: '1st innings',
      eventType: 'Wicket',
      message: 'J. Patel strikes! Delhi lose a key middle-order wicket.',
      team: 'Delhi Strikers',
      sequenceNo: 8,
      tags: ['wicket', 'breakthrough'],
      createdAt: '2026-09-18T18:47:00.000Z'
    },
    {
      id: 103,
      matchId: 1,
      minute: 29,
      actor: 'A. Khan',
      period: '1st innings',
      eventType: 'Six',
      message: 'A. Khan clears the ropes with a towering six into the stands.',
      team: 'Mumbai Mavericks',
      sequenceNo: 9,
      tags: ['six', 'powerplay'],
      createdAt: '2026-09-18T18:52:00.000Z'
    }
  ],
  2: [
    {
      id: 201,
      matchId: 2,
      minute: 12,
      actor: 'M. Gilbert',
      period: '1st half',
      eventType: 'Goal',
      message: 'M. Gilbert opens the scoring with a low-driven finish.',
      team: 'City United',
      sequenceNo: 1,
      tags: ['goal'],
      createdAt: '2026-09-18T19:27:00.000Z'
    }
  ],
  3: [
    {
      id: 301,
      matchId: 3,
      minute: 40,
      actor: 'D. Cole',
      period: '4th quarter',
      eventType: 'Three-pointer',
      message: 'D. Cole hits a clutch three to seal the win.',
      team: 'Lunar Kings',
      sequenceNo: 13,
      tags: ['three-pointer'],
      createdAt: '2026-09-18T18:18:00.000Z'
    }
  ]
};

app.use(express.json());
app.use(express.static(publicDir));

app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.get('/api/matches', (req, res) => {
  res.status(200).json({ message: 'Fetching matches...', data: mockMatches });
});

app.get('/api/matches/:id/commentary', (req, res) => {
  const matchId = Number(req.params.id);
  const data = mockCommentary[matchId] || [];
  res.status(200).json({ message: 'Fetching commentary...', data });
});

app.post('/api/matches/:id/commentary', (req, res) => {
  const matchId = Number(req.params.id);
  const payload = {
    id: Date.now(),
    matchId,
    minute: req.body.minute ?? 90,
    actor: req.body.actor ?? 'Live Desk',
    period: req.body.period ?? 'Live',
    eventType: req.body.eventType ?? 'Update',
    message: req.body.message ?? 'Live update received.',
    team: req.body.team ?? 'Neutral',
    sequenceNo: Date.now() % 1000,
    tags: req.body.tags ?? ['live'],
    createdAt: new Date().toISOString()
  };

  if (!mockCommentary[matchId]) {
    mockCommentary[matchId] = [];
  }

  mockCommentary[matchId].unshift(payload);
  res.status(201).json({ message: 'Commentary created successfully', data: payload });
});

app.use(securityMiddleware());
app.use('/matches', matchesRouter);
app.use('/matches/commentory', commentoryRouter);

const { broadcastMatches, broadcastCommentory } = setupWebSocketServer(server);
app.locals.broadcastMatches = broadcastMatches;
app.locals.broadcastCommentory = broadcastCommentory;

function startServer(port) {
  server.listen(port, HOST, () => {
    const baseUrl = HOST === '0.0.0.0' ? `http://localhost:${port}` : `http://${HOST}:${port}`;
    console.log(`server running on the baseUrl on ${baseUrl}`);
    console.log(`websocket server running on ${baseUrl.replace('http', 'ws')}/ws`);
  });
}

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    const nextPort = PORT + 1;
    console.warn(`Port ${PORT} is busy. Retrying on ${nextPort}...`);
    startServer(nextPort);
    return;
  }

  throw error;
});

startServer(PORT);