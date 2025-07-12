const express = require("express");

const app = express();
const PORT = process.env.PORT || 3001;
const WS_PORT = process.env.WS_PORT || 8080;

app.use(express.json());
app.use(express.static("public"));

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

console.log(`Express server running on http://localhost:${PORT}`);
console.log(`WebSocket server running on ws://localhost:${WS_PORT}`);