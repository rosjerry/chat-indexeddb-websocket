import { UserOutlined } from "@ant-design/icons";
import { Bubble, Sender } from "@ant-design/x";
import { Flex, type GetProp, Badge, message } from "antd";
import React from "react";
import { wsService, type ChatMessage } from "./websocket";

const roles: GetProp<typeof Bubble.List, "roles"> = {
  ai: {
    placement: "start",
    avatar: { icon: <UserOutlined />, style: { background: "#fde3cf" } },
    typing: { step: 5, interval: 20 },
    style: {
      maxWidth: 600,
    },
  },
  local: {
    placement: "end",
    avatar: { icon: <UserOutlined />, style: { background: "#87d068" } },
  },
};

export const Chat = () => {
  const [content, setContent] = React.useState("");
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  // Connect to WebSocket on component mount
  React.useEffect(() => {
    const connectToWebSocket = async () => {
      try {
        await wsService.connect();
        
        // Set up message handler
        wsService.onMessage((message) => {
          setMessages(prev => [...prev, message]);
        });

        // Set up connection status handler
        wsService.onConnectionChange((connected) => {
          setIsConnected(connected);
          if (connected) {
            message.success('Connected to chat server');
          } else {
            message.warning('Disconnected from chat server');
          }
        });
      } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
        message.error('Failed to connect to chat server');
      }
    };

    connectToWebSocket();

    // Cleanup on unmount
    return () => {
      wsService.disconnect();
    };
  }, []);

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;
    
    setIsLoading(true);
    
    try {
      wsService.sendMessage({
        text: text.trim(),
        user: 'User', // You can make this configurable
      });
      
      setContent("");
    } catch (error) {
      console.error('Failed to send message:', error);
      message.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Flex vertical gap="middle">
      <Badge 
        status={isConnected ? "success" : "error"} 
        text={isConnected ? "Connected" : "Disconnected"}
        style={{ alignSelf: 'flex-end' }}
      />
      <Bubble.List
        roles={roles}
        style={{ maxHeight: "85vh", overflow: "auto" }}
        items={messages.map((msg) => ({
          key: msg.id,
          loading: false,
          role: msg.user === 'User' ? "local" : "ai",
          content: msg.text,
        }))}
      />
      <Sender
        loading={isLoading}
        value={content}
        onChange={setContent}
        onSubmit={handleSendMessage}
        disabled={!isConnected}
      />
    </Flex>
  );
};
