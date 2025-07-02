import express from 'express';
import messageRoutes  from './routes/messageRoutes';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

app.use(express.json());

app.use('/chat', messageRoutes);

app.use(errorHandler);

export default app;