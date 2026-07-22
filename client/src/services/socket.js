import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : '');

const socket = io(SOCKET_URL, {
  autoConnect: true,
  transports: ['polling', 'websocket'], // start with polling so proxy works reliably
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 2000,
  reconnectionDelayMax: 10000,
  withCredentials: true,
});

export default socket;
