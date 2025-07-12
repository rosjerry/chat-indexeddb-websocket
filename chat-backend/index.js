const express = require("express");
const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT || 3001;
const WS_PORT = process.env.WS_PORT || 8080;

app.use(express.json());
app.use(express.static("public"));

const wss = new WebSocket.Server({ port: WS_PORT, });

wss.on('connection', ws => {
  console.log('Client connected');

  ws.on('message', data => {
    try {
      const parsedData = JSON.parse(data);
      console.log('Received message:', parsedData);

      if (parsedData.type === 'chat_message') {
        const chatMessage = parsedData.message;
        
        // Broadcast the message to all connected clients
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'chat_message',
              message: chatMessage
            }));
          }
        });

        console.log(`Broadcasted message from ${chatMessage.user}: ${chatMessage.text}`);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format'
      }));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'system',
    message: 'Welcome to the chat server!'
  }));
});

app.get("/", (req, res) => {
  res.send("hello world")
});

app.post("/send", async (req, res) => {
  try {
    const { text, user, timestamp } = req.body;
    console.log(" ====>>>> ",req.body)

    const message = {
      text,
      user,
      timestamp
    };

    console.log(message)
  } catch (error) {
    console.error("Error in /send endpoint:", error);
    res.status(500).json({
      error: "Failed to send message",
      details: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
  console.log(`WebSocket server running on ws://localhost:${WS_PORT}`);
})
