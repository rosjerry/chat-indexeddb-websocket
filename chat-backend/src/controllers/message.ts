import { Request, Response, NextFunction } from 'express';
const dummyData: any = [];

export const sendMessage = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = req.body;
    const newItem = { id: Date.now(), name };
    dummyData.push(newItem);
    res.status(201).json(newItem);
  } catch (error) {
    next(error);
  }
};

export const receiveMessages = (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(dummyData);
  } catch (error) {
    next(error);
  }
}