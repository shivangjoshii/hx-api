import http from 'http';
import app from './app.js';
import { connectDB } from './config/db.js';
import { initializeSockets } from './sockets/index.js';
import { ENV } from './config/env.js';

const server = http.createServer(app);

const io = initializeSockets(server, ENV.CORS_ORIGIN);

const startServer = async () => {
  try {
    await connectDB();

    server.listen(ENV.PORT, () => {
      console.log(`HabitX Server running in ${ENV.NODE_ENV} mode on port ${ENV.PORT}`);
    });
  } catch (error) {
    console.error(`Server failed to start: ${error.message}`);
    process.exit(1);
  }
};

startServer();

export { app, server, io };
