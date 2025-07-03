import express from 'express';
import messageRoutes  from './routes/messageRoutes';
import { errorHandler } from './middlewares/errorHandler';
import { run } from './services/consumer';
// import { run } from './services/producer'; 

const app = express();

app.use(express.json());

app.use('/chat', messageRoutes);

app.use(errorHandler);

run().catch(console.error);

export default app;