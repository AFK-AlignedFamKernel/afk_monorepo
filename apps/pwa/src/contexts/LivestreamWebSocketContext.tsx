import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface LivestreamWebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  isStreaming: boolean;
  streamKey: string | null;
  viewerCount: number;
  connect: (streamKey: string) => void;
  disconnect: () => void;
  startStream: (streamKey: string, userId: string) => void;
  stopStream: () => void;
  sendStreamData: (chunk: Blob) => void;
  joinStream: (streamKey: string, userId: string) => void;
  leaveStream: () => void;
  setupMediaStream: (mediaStream: MediaStream) => void;
}

const LivestreamWebSocketContext = createContext<LivestreamWebSocketContextType | undefined>(undefined);

interface LivestreamWebSocketProviderProps {
  children: React.ReactNode;
  backendUrl?: string;
}

export const LivestreamWebSocketProvider: React.FC<LivestreamWebSocketProviderProps> = ({
  children,
  backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamKey, setStreamKey] = useState<string | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  
  const socketRef = useRef<Socket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize socket connection
  const connect = useCallback((streamKey: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.disconnect();
    }

    const newSocket = io(backendUrl, {
      transports: ['websocket', 'polling'],
      query: { streamKey }
    });

    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setStreamKey(streamKey);
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      setIsStreaming(false);
      setStreamKey(null);
      setViewerCount(0);
    });

    newSocket.on('stream-started', (data) => {
      console.log('Stream started:', data);
      setIsStreaming(true);
    });

    newSocket.on('stream-stopped', () => {
      console.log('Stream stopped');
      setIsStreaming(false);
    });

    newSocket.on('viewer-count-update', (data) => {
      setViewerCount(data.count);
    });

    newSocket.on('stream-error', (error) => {
      console.error('Stream error:', error);
      setIsStreaming(false);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);
  }, [backendUrl]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
    }
    setIsConnected(false);
    setIsStreaming(false);
    setStreamKey(null);
    setViewerCount(0);
  }, []);

  const startStream = useCallback((streamKey: string, userId: string) => {
    if (!socketRef.current?.connected) {
      console.error('Socket not connected');
      return;
    }

    socketRef.current.emit('start-stream', {
      userId,
      streamKey
    });
  }, []);

  const stopStream = useCallback(() => {
    if (!socketRef.current?.connected) {
      return;
    }

    socketRef.current.emit('stop-stream', { streamKey });
    
    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }

    setIsStreaming(false);
  }, [streamKey]);

  const sendStreamData = useCallback((chunk: Blob) => {
    if (!socketRef.current?.connected || !isStreaming) {
      return;
    }

    // Convert blob to buffer for WebSocket transmission
    chunk.arrayBuffer().then(buffer => {
      socketRef.current?.emit('stream-data', {
        streamKey,
        chunk: Buffer.from(buffer)
      });
    });
  }, [streamKey, isStreaming]);

  const joinStream = useCallback((streamKey: string, userId: string) => {
    if (!socketRef.current?.connected) {
      console.error('Socket not connected');
      return;
    }

    socketRef.current.emit('join-stream', {
      userId,
      streamKey
    });
  }, []);

  const leaveStream = useCallback(() => {
    if (!socketRef.current?.connected) {
      return;
    }

    socketRef.current.emit('leave-stream', { streamKey });
  }, [streamKey]);

  // Setup media stream for broadcasting
  const setupMediaStream = useCallback((mediaStream: MediaStream) => {
    streamRef.current = mediaStream;
    
    try {
      const mediaRecorder = new MediaRecorder(mediaStream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 2500000 // 2.5 Mbps
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          sendStreamData(event.data);
        }
      };

      mediaRecorder.start(1000); // Send data every second
      mediaRecorderRef.current = mediaRecorder;
    } catch (error) {
      console.error('Failed to setup media recorder:', error);
    }
  }, [sendStreamData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const value: LivestreamWebSocketContextType = {
    socket,
    isConnected,
    isStreaming,
    streamKey,
    viewerCount,
    connect,
    disconnect,
    startStream,
    stopStream,
    sendStreamData,
    joinStream,
    leaveStream,
    setupMediaStream: setupMediaStream
  };

  return (
    <LivestreamWebSocketContext.Provider value={value}>
      {children}
    </LivestreamWebSocketContext.Provider>
  );
};

export const useLivestreamWebSocket = () => {
  const context = useContext(LivestreamWebSocketContext);
  if (context === undefined) {
    throw new Error('useLivestreamWebSocket must be used within a LivestreamWebSocketProvider');
  }
  return context;
};
