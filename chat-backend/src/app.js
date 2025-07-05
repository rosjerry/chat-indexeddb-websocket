import express from 'express';
import cors from 'cors';
// import messageRoutes  from './routes/messageRoutes';
// import { errorHandler } from './middlewares/errorHandler';
// import { run } from './services/consumer';
import { WebSocketServer } from 'ws';
import http from 'http';

import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.use(cors());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.static(path.join(__dirname, 'public')));

wss.on('connection', (ws) => {
  console.log('wss client connected here');

  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'Connected to WebSocket server'
  }));

  ws.on('message', (message) => {
    console.log('Received:', message.toString());
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

app.use(express.json());

// app.use('/', messageRoutes);

// app.use(errorHandler);


// run().catch(console.error);

export { server, wss };
export default app;