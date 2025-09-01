"use client";
import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useUIStore } from '@/store/uiStore';

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
  setupMediaStream: (mediaStream: MediaStream, streamKeyParam?: string) => void;
  cleanup: () => void;
}

const LivestreamWebSocketContext = createContext<LivestreamWebSocketContextType | undefined>(undefined);

interface LivestreamWebSocketProviderProps {
  children: React.ReactNode;
  backendUrl?: string;
}

export const LivestreamWebSocketProvider: React.FC<LivestreamWebSocketProviderProps> = ({
  children,
  backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5050'
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamKey, setStreamKey] = useState<string | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const { showToast } = useUIStore();
  
  const socketRef = useRef<Socket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Connect to WebSocket
  const connect = useCallback((streamKey: string) => {
    console.log('🔌 Connecting to WebSocket:', backendUrl);
    
    // Disconnect existing socket if any
    if (socketRef.current?.connected) {
      socketRef.current.disconnect();
    }

    const newSocket = io(backendUrl, {
      transports: ['websocket'],
      query: { streamKey }
    });

    newSocket.on('connect', () => {
      console.log('✅ WebSocket connected');
      setIsConnected(true);
      setStreamKey(streamKey);
      socketRef.current = newSocket;
      setSocket(newSocket);
      showToast({ message: 'WebSocket connected', type: 'success' });
    });

    newSocket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
      setIsConnected(false);
      setIsStreaming(false);
      setStreamKey(null);
      setViewerCount(0);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      setIsConnected(false);
      showToast({ message: 'WebSocket connection failed', type: 'error' });
    });

    // Stream events
    newSocket.on('stream-started', () => {
      console.log('🎬 Stream started');
      setIsStreaming(true);
    });

    newSocket.on('stream-ended', () => {
      console.log('🛑 Stream ended');
      setIsStreaming(false);
    });

    newSocket.on('stream-error', (error) => {
      console.error('❌ Stream error:', error);
      setIsStreaming(false);
      showToast({ message: `Stream error: ${error.error}`, type: 'error' });
    });

    newSocket.on('viewer-joined', (data) => {
      console.log('👥 Viewer joined:', data);
      setViewerCount(data.viewerCount);
    });

    newSocket.on('viewer-left', (data) => {
      console.log('👋 Viewer left:', data);
      setViewerCount(data.viewerCount);
    });

    newSocket.on('stream-segments-updated', (data) => {
      console.log('🎯 Stream segments updated:', data);
    });

  }, [backendUrl, showToast]);

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsConnected(false);
    setIsStreaming(false);
    setStreamKey(null);
    setViewerCount(0);
  }, []);

  // Start streaming
  const startStream = useCallback((streamKey: string, userId: string) => {
    if (!socketRef.current?.connected) {
      console.error('❌ WebSocket not connected');
      return;
    }

    console.log('🎬 Starting stream:', streamKey);
    
    // Update local state immediately when starting stream
    setIsStreaming(true);
    setStreamKey(streamKey);
    
    // Emit start-stream event to backend
    socketRef.current.emit('start-stream', { userId, streamKey });
    
    console.log('✅ Stream state updated to streaming');
  }, []);

  // Stop streaming
  const stopStream = useCallback(() => {
    if (!socketRef.current?.connected || !streamKey) {
      return;
    }

    console.log('🛑 Stopping stream:', streamKey);
    socketRef.current.emit('end-stream', { streamKey });
    
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    
    setIsStreaming(false);
    setStreamKey(null);
  }, [streamKey]);

  // Send video data
  const sendStreamData = useCallback((chunk: Blob) => {
    if (!socketRef.current?.connected || !isStreaming || !streamKey) {
      return;
    }

    console.log('📡 Sending video chunk:', chunk.size, 'bytes');
    
    chunk.arrayBuffer().then(buffer => {
      socketRef.current?.emit('stream-data', {
        streamKey,
        chunk: Buffer.from(buffer)
      });
    });
  }, [isStreaming, streamKey]);

  // Join stream as viewer
  const joinStream = useCallback((streamKey: string, userId: string) => {
    if (!socketRef.current?.connected) {
      return;
    }

    console.log('👥 Joining stream:', streamKey);
    socketRef.current.emit('join-stream', { userId, streamKey });
  }, []);

  // Leave stream
  const leaveStream = useCallback(() => {
    if (!socketRef.current?.connected || !streamKey) {
      return;
    }

    console.log('👋 Leaving stream:', streamKey);
    socketRef.current.emit('leave-stream', { streamKey });
  }, [streamKey]);

  // Setup MediaRecorder for streaming
  const setupMediaStream = useCallback((mediaStream: MediaStream, streamKeyParam?: string) => {
    const currentStreamKey = streamKeyParam || streamKey;
    if (!currentStreamKey) {
      console.error('❌ No stream key for MediaRecorder setup');
      return;
    }

    console.log('🎥 Setting up MediaRecorder for stream:', currentStreamKey);
    
    try {
      // Find supported MIME type
      const supportedTypes = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
      let selectedMimeType: string | null = null;
      
      for (const type of supportedTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          selectedMimeType = type;
          break;
        }
      }
      
      if (!selectedMimeType) {
        throw new Error('No supported video format found');
      }

      const mediaRecorder = new MediaRecorder(mediaStream, {
        mimeType: selectedMimeType,
        videoBitsPerSecond: 2500000
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          console.log('📡 MediaRecorder data available:', event.data.size, 'bytes');
          sendStreamData(event.data);
        }
      };

      mediaRecorder.onstart = () => {
        console.log('🎬 MediaRecorder started');
      };

      mediaRecorder.onerror = (event) => {
        console.error('❌ MediaRecorder error:', event);
      };

      mediaRecorder.onstop = () => {
        console.log('🛑 MediaRecorder stopped');
      };

      mediaRecorder.start(1000); // Send data every second
      mediaRecorderRef.current = mediaRecorder;
      streamRef.current = mediaStream;
      
      // Ensure we're in streaming state when MediaRecorder starts
      if (streamKeyParam || streamKey) {
        setIsStreaming(true);
        console.log('✅ MediaRecorder started - stream is now active');
      }
      
      console.log('✅ MediaRecorder setup complete');
      
    } catch (error) {
      console.error('❌ MediaRecorder setup failed:', error);
    }
  }, [streamKey, sendStreamData]);

  // Cleanup
  const cleanup = useCallback(() => {
    if (isStreaming && streamKey) {
      stopStream();
    }
    disconnect();
  }, [isStreaming, streamKey, stopStream, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

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
    setupMediaStream,
    cleanup
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
