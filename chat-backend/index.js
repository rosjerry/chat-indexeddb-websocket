const { Kafka } = require("kafkajs");
const express = require("express");
const { WebSocketServer } = require("ws");
const path = require("path");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3001;
const WS_PORT = process.env.WS_PORT || 8080;

// Middleware
app.use(express.json());
app.use(express.static("public")); // Serve static files from public directory

// Serve the WebSocket client
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "websocket-client.html"));
});

// WebSocket Server Setup
const sockserver = new WebSocketServer({ port: WS_PORT });
const clients = new Map(); // Store client info with their connections

sockserver.on("connection", (ws, req) => {
  const clientId = generateClientId();
  clients.set(ws, { id: clientId, isAlive: true });

  console.log(`New client connected! Client ID: ${clientId}`);

  // Send welcome message
  ws.send(
    JSON.stringify({
      type: "system",
      message: "Connection established",
      clientId: clientId,
      timestamp: new Date().toISOString(),
    })
  );

  // Handle incoming messages from WebSocket clients
  ws.on("message", async (data) => {
    try {
      const messageData = JSON.parse(data.toString());

      // Add client info to message
      const enrichedMessage = {
        ...messageData,
        clientId: clientId,
        timestamp: new Date().toISOString(),
      };

      // Send message to Kafka
      await sendMessage(enrichedMessage);
      console.log(
        `Message from client ${clientId} sent to Kafka:`,
        enrichedMessage
      );
    } catch (error) {
      console.error("Error processing WebSocket message:", error);
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Failed to process message",
          timestamp: new Date().toISOString(),
        })
      );
    }
  });

  // Handle client disconnect
  ws.on("close", () => {
    console.log(`Client ${clientId} disconnected`);
    clients.delete(ws);
  });

  // Handle WebSocket errors
  ws.on("error", (error) => {
    console.error(`WebSocket error for client ${clientId}:`, error);
    clients.delete(ws);
  });

  // Heartbeat mechanism
  ws.on("pong", () => {
    const client = clients.get(ws);
    if (client) {
      client.isAlive = true;
    }
  });
});

// Heartbeat interval to detect dead connections
const heartbeatInterval = setInterval(() => {
  sockserver.clients.forEach((ws) => {
    const client = clients.get(ws);
    if (!client || !client.isAlive) {
      console.log(`Terminating dead connection: ${client?.id || "unknown"}`);
      clients.delete(ws);
      return ws.terminate();
    }

    client.isAlive = false;
    ws.ping();
  });
}, 30000); // Check every 30 seconds

// Kafka Configuration
const kafka = new Kafka({
  clientId: "chat-app",
  brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
  connectionTimeout: 3000,
  requestTimeout: 25000,
});

const admin = kafka.admin();
const producer = kafka.producer({
  maxInFlightRequests: 1,
  idempotent: true,
  transactionTimeout: 30000,
});
const consumer = kafka.consumer({
  groupId: "chat-group",
  sessionTimeout: 30000,
  heartbeatInterval: 3000,
});

const TOPIC_NAME = "chat-messages";

// Kafka Functions
async function initializeKafka() {
  try {
    console.log("Initializing Kafka...");

    // Connect admin client
    await admin.connect();
    console.log("Admin client connected");

    // Create topic if it doesn't exist
    const existingTopics = await admin.listTopics();
    if (!existingTopics.includes(TOPIC_NAME)) {
      await admin.createTopics({
        topics: [
          {
            topic: TOPIC_NAME,
            numPartitions: 3,
            replicationFactor: 1,
            configEntries: [
              { name: "retention.ms", value: "604800000" }, // 7 days retention
            ],
          },
        ],
      });
      console.log(`Topic "${TOPIC_NAME}" created successfully`);
    } else {
      console.log(`Topic "${TOPIC_NAME}" already exists`);
    }

    // Connect producer
    await producer.connect();
    console.log("Producer connected");

    // Connect consumer
    await consumer.connect();
    console.log("Consumer connected");

    // Subscribe to topic
    await consumer.subscribe({ topic: TOPIC_NAME, fromBeginning: false });
    console.log(`Consumer subscribed to "${TOPIC_NAME}"`);
  } catch (error) {
    console.error("Error initializing Kafka:", error);
    throw error;
  }
}

async function sendMessage(message) {
  try {
    const messageWithMetadata = {
      ...message,
      id: generateMessageId(),
      kafkaTimestamp: new Date().toISOString(),
    };

    await producer.send({
      topic: TOPIC_NAME,
      messages: [
        {
          key: message.user || message.clientId, // Use user or clientId as key for partitioning
          value: JSON.stringify(messageWithMetadata),
          timestamp: Date.now().toString(),
        },
      ],
    });

    console.log("Message sent to Kafka successfully");
    return messageWithMetadata;
  } catch (error) {
    console.error("Error sending message to Kafka:", error);
    throw error;
  }
}

// Function to broadcast message to all WebSocket clients
function broadcastToClients(message) {
  const messageStr = JSON.stringify(message);
  let sentCount = 0;

  sockserver.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(messageStr);
      sentCount++;
    }
  });

  console.log(`Broadcasted message to ${sentCount} clients`);
}

// Function to start consuming messages
async function startConsuming() {
  try {
    await consumer.run({
      eachMessage: async ({ topic, partition, message, heartbeat }) => {
        try {
          const messageData = JSON.parse(message.value.toString());

          console.log("Message received from Kafka:", {
            topic,
            partition,
            offset: message.offset,
            key: message.key?.toString(),
            value: messageData,
          });

          // Broadcast message to all connected WebSocket clients
          broadcastToClients({
            type: "chat",
            ...messageData,
            kafkaMetadata: {
              topic,
              partition,
              offset: message.offset,
            },
          });

          // Call heartbeat to ensure consumer stays alive
          await heartbeat();
        } catch (error) {
          console.error("Error processing consumed message:", error);
        }
      },
    });

    console.log("Started consuming messages from Kafka");
  } catch (error) {
    console.error("Error starting consumer:", error);
    throw error;
  }
}

// Cleanup function
async function cleanup() {
  try {
    console.log("Starting cleanup...");

    clearInterval(heartbeatInterval);

    // Close WebSocket server
    sockserver.close(() => {
      console.log("WebSocket server closed");
    });

    // Disconnect Kafka clients
    await Promise.all([
      producer.disconnect(),
      consumer.disconnect(),
      admin.disconnect(),
    ]);

    console.log("Kafka connections closed");
  } catch (error) {
    console.error("Error during cleanup:", error);
  }
}

// Utility functions
function generateClientId() {
  return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateMessageId() {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// REST API Endpoints
app.post("/send", async (req, res) => {
  try {
    const { text, user } = req.body;

    if (!text || !user) {
      return res.status(400).json({
        error: "Both text and user are required",
      });
    }

    const message = {
      text,
      user,
      timestamp: new Date().toISOString(),
      source: "http",
    };

    const sentMessage = await sendMessage(message);

    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "http://localhost:8082/send",
      headers: {
        "Content-Type": "application/json",
      },
      data: message,
    };

    await axios
      .request(config)
      .then((response) => {
        console.log(JSON.stringify(response.data));
      })
      .catch((error) => {
        console.log(error);
      });

    res.status(200).json({
      success: true,
      message: sentMessage,
    });
  } catch (error) {
    console.error("Error in /send endpoint:", error);
    res.status(500).json({
      error: "Failed to send message",
      details: error.message,
    });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    connections: sockserver.clients.size,
    uptime: process.uptime(),
  });
});

// Get recent messages endpoint
app.get("/messages", (req, res) => {
  // In a production app, you'd fetch from a database or Kafka
  res.json({
    message:
      "Message history endpoint - implement with database or Kafka consumer",
    timestamp: new Date().toISOString(),
  });
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\nReceived SIGINT, shutting down gracefully...");
  await cleanup();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\nReceived SIGTERM, shutting down gracefully...");
  await cleanup();
  process.exit(0);
});

// Error handling for uncaught exceptions
process.on("uncaughtException", async (error) => {
  console.error("Uncaught Exception:", error);
  await cleanup();
  process.exit(1);
});

process.on("unhandledRejection", async (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  await cleanup();
  process.exit(1);
});

// Start the application
async function startApplication() {
  try {
    await initializeKafka();
    await startConsuming();

    app.listen(PORT, () => {
      console.log(`Express server running on http://localhost:${PORT}`);
      console.log(`WebSocket server running on ws://localhost:${WS_PORT}`);
      console.log("Chat application is ready!");
    });
  } catch (error) {
    console.error("Failed to start application:", error);
    process.exit(1);
  }
}

// Export functions for testing
module.exports = {
  initializeKafka,
  sendMessage,
  startConsuming,
  cleanup,
  producer,
  consumer,
  admin,
  app,
};

// Start the application if this file is run directly
if (require.main === module) {
  startApplication();
}
