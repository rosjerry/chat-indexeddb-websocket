import { Request, Response, NextFunction } from 'express';
import { messages, Message } from '../models/messageModel';

export const sendMessage = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { text } = req.body;
    const newItem = { id: Date.now(), text };
    messages.push(newItem);
    res.status(201).json(newItem);
  } catch (error) {
    next(error);
  }
};

export const receiveMessages = (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(messages);
  } catch (error) {
    next(error);
  }
}