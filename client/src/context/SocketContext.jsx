import React, { createContext, useContext, useEffect } from 'react';
import { socket } from '../services/socket';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !user._id) return;

    const joinRooms = () => {
      const token = localStorage.getItem('token');
      if (token) {
        socket.emit('JOIN_USER_ROOM', { userId: user._id, token });
        socket.emit('JOIN_ROLE_ROOM', { role: user.role, token });
      }
    };

    // Join initially
    joinRooms();

    // Re-join on reconnect
    socket.on('connect', joinRooms);

    return () => {
      socket.off('connect', joinRooms);
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
