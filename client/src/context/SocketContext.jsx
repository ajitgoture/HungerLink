import React, { createContext, useContext, useEffect } from 'react';
import { socket } from '../services/socket';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!user?._id || !token) {
      if (socket.connected) socket.disconnect();
      return;
    }

    const joinRooms = () => {
      socket.emit('JOIN_USER_ROOM', { userId: user._id, token });
      socket.emit('JOIN_ROLE_ROOM', { role: user.role, token });
    };

    socket.on('connect', joinRooms);
    if (socket.connected) joinRooms();
    else socket.connect();

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
