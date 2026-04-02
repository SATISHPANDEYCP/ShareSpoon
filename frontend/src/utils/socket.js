import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

/**
 * Initialize socket connection
 * @param {string} userId - User ID to join personal room
 */
export const initializeSocket = (userId) => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
      if (userId) {
        socket.emit('join', userId);
      }
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }

  return socket;
};

/**
 * Get socket instance
 */
export const getSocket = () => {
  return socket;
};

/**
 * Disconnect socket
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Listen to socket events
 */
export const onSocketEvent = (event, callback) => {
  if (socket) {
    socket.on(event, callback);
  }
};

/**
 * Remove socket event listener
 */
export const offSocketEvent = (event, callback) => {
  if (socket) {
    socket.off(event, callback);
  }
};

/**
 * Emit socket event
 */
export const emitSocketEvent = (event, data) => {
  if (socket) {
    socket.emit(event, data);
  }
};
