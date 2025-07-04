import { Request, Response, NextFunction } from 'express';
import { messages, Message } from '../models/messageModel';
import { run } from '../services/producer';
import { broadcastMessage } from '../app';
import { v4 as uuid } from 'uuid';

export const sendMessage = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { text, user } = req.body;

    if (!text || !user) {
      res.status(400).json({ error: 'Text and user are required' });
      return;
    }

    const newMessage: Message = {
      id: uuid(),
      text: text,
      user: user,
      timestamp: new Date().toISOString(),
    };
    
    await run(newMessage);
    
    messages.push(newMessage);
    
    broadcastMessage({
      type: 'rest-message',
      ...newMessage
    });
    
    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({ error: 'Failed to create message' });
    next(error);
  }
};

export const receiveMessages = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    res.json(messages);
  } catch (error) {
    next(error);
  }
};
