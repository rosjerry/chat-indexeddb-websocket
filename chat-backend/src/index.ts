import { server } from './app';
import config from './config';

server.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
  console.log(`WebSocket server is ready on ws://localhost:${config.port}`);
});