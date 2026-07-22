import { io } from 'socket.io-client';

const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL;
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');
  if (typeof window !== 'undefined' && window.location.hostname.endsWith('onrender.com')) {
    return 'https://stone-india-website.onrender.com';
  }
  return '';
};

const SOCKET_URL = getSocketUrl();

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
