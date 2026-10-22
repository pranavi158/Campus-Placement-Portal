import { io } from 'socket.io-client';
import { API_BASE_URL } from './api';

let socket = null;

/**
 * Returns a shared Socket.io client instance authenticated with JWT.
 */
export const getSocket = () => {
  const token = localStorage.getItem('placement_token');

  if (!socket) {
    socket = io(API_BASE_URL, {
      autoConnect: true,
      withCredentials: true,
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('⚡ [Socket.io] Connected to interview signaling server, ID:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.warn('⚠️ [Socket.io] Connection warning:', err.message);
    });
  } else {
    // Keep auth token fresh
    if (token && socket.auth?.token !== token) {
      socket.auth = { token };
      if (socket.connected) {
        socket.disconnect().connect();
      }
    }
  }

  return socket;
};

export default getSocket;
