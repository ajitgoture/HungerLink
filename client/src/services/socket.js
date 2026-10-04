import { io } from 'socket.io-client';

const SOCKET_URL = `http://${window.location.hostname}:5000`;

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
});
