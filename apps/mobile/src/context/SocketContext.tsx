import React, {createContext, useContext, useEffect, useRef, useState} from 'react';
import io, {Socket} from 'socket.io-client';

import {INDEXER_BACKEND_URL} from '../constants/env';

interface SocketContextType {
  socketRef: React.MutableRefObject<Socket | null>;
  isConnected: boolean;
}
export const SOCKET_URL = INDEXER_BACKEND_URL || 'http://127.0.0.1:5050/';

const SocketContext = createContext<SocketContextType | null>(null);

export const SocketProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket'],
    });

    socketRef.current.on('connect', () => setIsConnected(true));
    socketRef.current.on('disconnect', () => setIsConnected(false));

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={{socketRef, isConnected}}>{children}</SocketContext.Provider>
  );
};

export const useSocketContext = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketContext must be used within a Socket  Provider');
  }
  return context;
};
