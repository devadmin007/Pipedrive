import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthCheck } from './auth';

const SOCKET_URL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000';

let socket: Socket | null = null;

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const { isAuthenticated, user } = useAuthCheck();

  useEffect(() => {
    // Only connect if user is authenticated
    if (!isAuthenticated || !user) return;
    
    if (!socket) {
      socket = io(SOCKET_URL);
    }

    // Event listeners
    socket.on('connect', () => {
      setIsConnected(true);
      socket?.emit('join', user.id);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [isAuthenticated, user]);

  return { socket, isConnected };
};