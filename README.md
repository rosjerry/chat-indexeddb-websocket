# WebSocket Chat Application

A real-time chat application built with React (frontend) and Node.js (backend) using WebSocket communication.

## Features

- Real-time messaging via WebSocket
- Connection status indicator
- Auto-reconnection on connection loss
- Modern UI with Ant Design components

## Project Structure

```
chat-indexeddb-websocket/
├── chat-backend/          # Node.js WebSocket server
│   ├── index.js          # Main server file
│   └── package.json      # Backend dependencies
└── chat-frontend/        # React frontend
    ├── src/
    │   ├── App.tsx       # Main app component
    │   ├── Chat.tsx      # Chat component
    │   ├── websocket.ts  # WebSocket service
    │   └── main.tsx      # App entry point
    └── package.json      # Frontend dependencies
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd chat-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the WebSocket server:
   ```bash
   npm start
   ```

The backend will start on:
- HTTP server: http://localhost:3001
- WebSocket server: ws://localhost:8080

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd chat-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at http://localhost:5173

## Usage

1. Open the frontend application in your browser
2. The chat will automatically connect to the WebSocket server
3. You'll see a connection status indicator (green for connected, red for disconnected)
4. Type messages in the input field and press Enter to send
5. Messages will be broadcast to all connected clients in real-time

## WebSocket Communication

The application uses WebSocket for real-time communication:

- **Message Format**: JSON with `type` and `message` fields
- **Message Types**:
  - `chat_message`: User chat messages
  - `system`: System messages (welcome, etc.)
  - `error`: Error messages

## Features

- **Real-time Messaging**: Instant message delivery via WebSocket
- **Connection Management**: Automatic reconnection on connection loss
- **Status Indicators**: Visual feedback for connection status
- **Error Handling**: Graceful error handling and user notifications
- **Responsive UI**: Modern interface built with Ant Design

## Development

### Backend
- WebSocket server runs on port 8080
- Express server runs on port 3001
- Supports multiple concurrent connections
- Broadcasts messages to all connected clients

### Frontend
- React application with TypeScript
- Uses Ant Design for UI components
- WebSocket service handles connection management
- Real-time message updates
