import { Server } from 'socket.io';
import { setupRoomSockets } from './roomSocket.js';

export const initializeSockets = (httpServer, corsOrigin) => {
  const io = new Server(httpServer, {
    cors: {
      origin: corsOrigin || '*',
      methods: ['GET', 'POST']
    }
  });

  setupRoomSockets(io);

  return io;
};
