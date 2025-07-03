import { Request, Response, NextFunction } from 'express';
import { messages, Message } from '../models/messageModel';
import { run } from '../services/producer';
import { v4 as uuid } from 'uuid';

export const createUser = async(req: any, res: any) => {
  try {
    const newUser = req.body.username;
    
    run(newUser)
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
}

export const sendMessage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { text, user } = req.body;

    const newMessage: Message = {
      id: uuid(),
      text: text,
      user: user,
      timestamp: new Date().toISOString(),
    };
    run(newMessage);
    messages.push(newMessage);
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
) => {
  try {
    res.json(messages);
  } catch (error) {
    next(error);
  }
};
