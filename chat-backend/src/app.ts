import express from 'express';
import cors from 'cors';
import messageRoutes  from './routes/messageRoutes';
import { errorHandler } from './middlewares/errorHandler';
import { run } from './services/consumer';
import WebSocket from 'ws';
import http from 'http';

const app = express();

// Enable CORS
app.use(cors());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Store WebSocket clients
export const wsClients = new Set<WebSocket>();

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('New WebSocket client connected');
  wsClients.add(ws);

  // Send welcome message
  ws.send(JSON.stringify({ 
    type: 'system', 
    message: 'Connected to chat server', 
    timestamp: new Date().toISOString() 
  }));

  // Handle incoming messages from WebSocket clients
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('Received message from client:', message);
      
      // You can add message validation here
      if (message.type === 'chat' && message.content) {
        // Broadcast to all connected clients
        broadcastMessage({
          type: 'chat',
          content: message.content,
          username: message.username || 'Anonymous',
          timestamp: new Date().toISOString(),
          id: Date.now().toString()
        });
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Invalid message format' 
      }));
    }
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    wsClients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    wsClients.delete(ws);
  });
});

// Function to broadcast messages to all connected clients
export const broadcastMessage = (message: any) => {
  const messageString = JSON.stringify(message);
  wsClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageString);
    }
  });
};

app.use(express.json());

app.use('/chat', messageRoutes);

app.use(errorHandler);

// Start Kafka consumer (commented out for testing)
// run().catch(console.error);

export { server, wss };
export default app;