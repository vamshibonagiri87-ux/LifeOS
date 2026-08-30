import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from './env.js';

let ioInstance = null;

export function initSocket(server) {
  ioInstance = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || origin === config.clientUrl || origin.startsWith('http://localhost:') || origin.endsWith('.vercel.app') || origin.endsWith('.onrender.com')) {
          callback(null, true);
        } else {
          callback(null, true);
        }
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
  });

  // JWT Authentication middleware for Socket.IO
  ioInstance.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
    if (!token) {
      // Allow anonymous connection for demo/dev, but tag room if available
      return next();
    }
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      console.warn('[Socket.IO] Auth token invalid or expired for handshake');
      next();
    }
  });

  ioInstance.on('connection', (socket) => {
    const userId = socket.userId || socket.handshake.query?.userId;
    if (userId) {
      socket.join(`user:${userId}`);
      console.log(`[Socket.IO] Client connected and joined room: user:${userId}`);
    } else {
      console.log(`[Socket.IO] Anonymous client connected: ${socket.id}`);
    }

    socket.on('join_user_room', (id) => {
      if (id) {
        socket.join(`user:${id}`);
      }
    });

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });

  return ioInstance;
}

export function getIO() {
  return ioInstance;
}

export function emitUserEvent(userId, eventName, data) {
  if (!ioInstance) return;
  if (userId) {
    ioInstance.to(`user:${userId}`).emit(eventName, data);
  }
  // Also emit globally for local single-user convenience
  ioInstance.emit(eventName, data);
}
