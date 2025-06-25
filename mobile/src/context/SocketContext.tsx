// import React, {createContext, useContext, useEffect, useRef, useState} from 'react';
// import io, {Socket} from 'socket.io-client';

// import {INDEXER_BACKEND_URL} from '../constants/env';

// interface SocketContextType {
//   socketRef: React.MutableRefObject<Socket | null>;
//   isConnected: boolean;
// }
// export const SOCKET_URL = INDEXER_BACKEND_URL || 'http://127.0.0.1:5050/';

// const SocketContext = createContext<SocketContextType | null>(null);

// export const SocketProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
//   const socketRef = useRef<Socket | null>(null);
//   const [isConnected, setIsConnected] = useState(false);

//   useEffect(() => {
//     socketRef.current = io(SOCKET_URL, {
//       transports: ['websocket'],
//     });

//     socketRef.current.on('connect', () => setIsConnected(true));
//     socketRef.current.on('disconnect', () => setIsConnected(false));

//     return () => {
//       if (socketRef.current) {
//         socketRef.current.disconnect();
//       }
//     };
//   }, []);

//   return (
//     <SocketContext.Provider value={{socketRef, isConnected}}>{children}</SocketContext.Provider>
//   );
// };

// export const useSocketContext = () => {
//   const context = useContext(SocketContext);
//   if (!context) {
//     throw new Error('useSocketContext must be used within a Socket  Provider');
//   }
//   return context;
// };

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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

  // Memoize socket options to prevent unnecessary reconnections
  const socketOptions = useMemo(
    () => ({
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity, // Keep trying to reconnect
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      // Add ping timeout to detect stale connections
      pingTimeout: 5000,
      pingInterval: 10000,
    }),
    [],
  );

  useEffect(() => {
    // Only create a new socket if one doesn't exist
    if (!socketRef.current) {
      socketRef.current = io(SOCKET_URL, socketOptions);

      // Connection event handlers
      const handleConnect = () => {
        console.log('Socket connected');
        setIsConnected(true);
      };

      const handleDisconnect = (reason: string) => {
        console.log('Socket disconnected:', reason);
        // setIsConnected(false);
      };

      const handleConnectError = (error: Error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
      };

      const handleReconnectAttempt = (attemptNumber: number) => {
        console.log(`Attempting to reconnect... (${attemptNumber})`);
      };

      // Attach event listeners
      socketRef.current.on('connect', handleConnect);
      socketRef.current.on('disconnect', handleDisconnect);
      socketRef.current.on('connect_error', handleConnectError);
      socketRef.current.on('reconnect_attempt', handleReconnectAttempt);

      // Heartbeat to keep connection alive
      const heartbeat = setInterval(() => {
        if (socketRef.current?.connected) {
          socketRef.current.emit('ping');
        }
      }, 30000);

      return () => {
        clearInterval(heartbeat);
        if (socketRef.current) {
          socketRef.current.off('connect', handleConnect);
          socketRef.current.off('disconnect', handleDisconnect);
          socketRef.current.off('connect_error', handleConnectError);
          socketRef.current.off('reconnect_attempt', handleReconnectAttempt);
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      };
    }
    return;
  }, [socketOptions]);

  const reconnect = useCallback(() => {
    if (socketRef.current) {
      console.log('Manual reconnect triggered');
      socketRef.current.connect();
    }
  }, []);

  const contextValue = useMemo(
    () => ({
      socketRef,
      isConnected,
      reconnect,
    }),
    [isConnected, reconnect],
  );

  return <SocketContext.Provider value={contextValue}>{children}</SocketContext.Provider>;
};

export const useSocketContext = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketContext must be used within a SocketProvider');
  }
  return context;
};
