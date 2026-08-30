import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socketInstance = null;

export function getSocket() {
  if (!socketInstance) {
    const token = localStorage.getItem('lifeos_token');
    const user = JSON.parse(localStorage.getItem('lifeos_user') || '{}');

    socketInstance = io(SOCKET_URL, {
      auth: { token },
      query: { userId: user.id || user._id },
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socketInstance.on('connect', () => {
      console.log('[Socket.IO] Connected to LifeOS real-time server:', socketInstance.id);
      if (user.id || user._id) {
        socketInstance.emit('join_user_room', user.id || user._id);
      }
    });

    socketInstance.on('disconnect', () => {
      console.log('[Socket.IO] Disconnected from real-time server');
    });
  }
  return socketInstance;
}

export function reconnectSocketWithAuth() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
  return getSocket();
}
