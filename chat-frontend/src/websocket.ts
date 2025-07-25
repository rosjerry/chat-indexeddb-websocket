export interface ChatMessage {
  id: string;
  text: string;
  user: string;
  timestamp: number;
}

export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private messageHandlers: ((message: ChatMessage) => void)[] = [];
  private connectionHandlers: ((connected: boolean) => void)[] = [];
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log('[WebSocket] Attempting to connect to', this.url);
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('[WebSocket] Connected');
          this.reconnectAttempts = 0;
          this.notifyConnectionChange(true);
          resolve();
        };

        this.ws.onmessage = (event) => {
          console.log('[WebSocket] Message received:', event.data);
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'chat_message') {
              this.notifyMessageHandlers(data.message);
            }
          } catch (error) {
            console.error('[WebSocket] Error parsing message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('[WebSocket] Disconnected', event);
          this.notifyConnectionChange(false);
          this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('[WebSocket] Error:', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`[WebSocket] Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      setTimeout(() => {
        this.connect().catch((error) => {
          console.error('[WebSocket] Reconnection failed:', error);
        });
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('[WebSocket] Max reconnection attempts reached');
    }
  }

  sendMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const chatMessage: ChatMessage = {
        ...message,
        id: Date.now().toString(),
        timestamp: Date.now(),
      };
      console.log('[WebSocket] Sending message:', chatMessage);
      this.ws.send(JSON.stringify({
        type: 'chat_message',
        message: chatMessage
      }));
    } else {
      console.error('[WebSocket] Cannot send message, not connected');
    }
  }

  onMessage(handler: (message: ChatMessage) => void): void {
    this.messageHandlers.push(handler);
  }

  onConnectionChange(handler: (connected: boolean) => void): void {
    this.connectionHandlers.push(handler);
  }

  private notifyMessageHandlers(message: ChatMessage): void {
    this.messageHandlers.forEach(handler => handler(message));
  }

  private notifyConnectionChange(connected: boolean): void {
    this.connectionHandlers.forEach(handler => handler(connected));
  }

  disconnect(): void {
    if (this.ws) {
      console.log('[WebSocket] Closing connection');
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const wsService = new WebSocketService('ws://localhost:8080'); 