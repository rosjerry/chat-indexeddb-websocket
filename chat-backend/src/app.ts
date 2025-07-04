import express from 'express';
import messageRoutes  from './routes/messageRoutes';
import { errorHandler } from './middlewares/errorHandler';
import { run } from './services/consumer';
import WebSocket from 'ws';
import http from 'http';

const app = express();

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('New WebSocket client connected');
  wsClients.add(ws);

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    wsClients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    wsClients.delete(ws);
  });
});


app.use(express.json());

app.use('/chat', messageRoutes);

app.use(errorHandler);

run().catch(console.error);

export default app;