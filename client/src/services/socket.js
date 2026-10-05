import { io } from 'socket.io-client';

export const socket = io({
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
});
