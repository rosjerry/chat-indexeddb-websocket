import { Request, Response, NextFunction } from 'express';
import { messages, Message } from '../models/messageModel';
import { run } from '../services/producer';
import { v4 as uuid } from 'uuid';

export const sendMessage = async (
  req,
  res,
  next,
) => {
  try {
    const { text, user } = req.body;

    if (!text || !user) {
      res.status(400).json({ error: 'Text and user are required' });
      return;
    }

    const newMessage = {
      id: uuid(),
      text: text,
      user: user,
      timestamp: new Date().toISOString(),
    };
    
    await run(newMessage);
    
    messages.push(newMessage);
    
    console.log('Message sent:', newMessage);
    
    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({ error: 'Failed to create message' });
    next(error);
  }
};

export const receiveMessages = (
  _req,
  res,
  next,
) => {
  try {
    res.json(messages);
  } catch (error) {
    next(error);
  }
};
