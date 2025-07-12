import { UserOutlined } from "@ant-design/icons";
import { Bubble, Sender } from "@ant-design/x";
import { Flex, type GetProp, Badge, message, Button, Input, Space } from "antd";
import React from "react";
import { wsService, type ChatMessage } from "./websocket";
import { UsernameManager } from "./username";

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
  const [username, setUsername] = React.useState("");
  const [showUsernameInput, setShowUsernameInput] = React.useState(false);
  const [newUsername, setNewUsername] = React.useState("");

  // Initialize username on component mount
  React.useEffect(() => {
    const storedUsername = UsernameManager.getUsername();
    setUsername(storedUsername);
  }, []);

  // Connect to WebSocket on component mount
  React.useEffect(() => {
    const connectToWebSocket = async () => {
      try {
        await wsService.connect();
        
        // Set up message handler
        wsService.onMessage((message) => {
          // Don't add messages that the current user sent (they're already in local state)
          if (message.user !== username) {
            setMessages(prev => [...prev, message]);
          }
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

    if (username) {
      connectToWebSocket();
    }

    // Cleanup on unmount
    return () => {
      wsService.disconnect();
    };
  }, [username]);

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;
    
    setIsLoading(true);
    
    try {
      const newMessage = {
        id: Date.now().toString(),
        text: text.trim(),
        user: username,
        timestamp: Date.now(),
      };
      
      // Add message to local state immediately
      setMessages(prev => [...prev, newMessage]);
      
      // Send message via WebSocket
      wsService.sendMessage({
        text: text.trim(),
        user: username,
      });
      
      setContent("");
    } catch (error) {
      console.error('Failed to send message:', error);
      message.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateNewUsername = () => {
    const newUsername = UsernameManager.generateAndSaveUsername();
    setUsername(newUsername);
    message.success('New username generated!');
  };

  const handleChangeUsername = () => {
    if (newUsername.trim()) {
      UsernameManager.setUsername(newUsername.trim());
      setUsername(newUsername.trim());
      setShowUsernameInput(false);
      setNewUsername("");
      message.success('Username changed!');
    }
  };

  return (
    <Flex vertical gap="middle">
      <Flex justify="space-between" align="center">
        <Space>
          <span>Username: <strong>{username}</strong></span>
          <Button size="small" onClick={handleGenerateNewUsername}>
            Generate New
          </Button>
          <Button 
            size="small" 
            onClick={() => setShowUsernameInput(!showUsernameInput)}
          >
            Change
          </Button>
        </Space>
        <Badge 
          status={isConnected ? "success" : "error"} 
          text={isConnected ? "Connected" : "Disconnected"}
        />
      </Flex>
      
      {showUsernameInput && (
        <Flex gap="small">
          <Input
            placeholder="Enter new username"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            onPressEnter={handleChangeUsername}
          />
          <Button onClick={handleChangeUsername}>Save</Button>
          <Button onClick={() => {
            setShowUsernameInput(false);
            setNewUsername("");
          }}>Cancel</Button>
        </Flex>
      )}
      
      <Bubble.List
        roles={roles}
        style={{ maxHeight: "85vh", overflow: "auto" }}
        items={messages.map((msg) => ({
          key: msg.id,
          loading: false,
          role: msg.user === username ? "local" : "ai",
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
