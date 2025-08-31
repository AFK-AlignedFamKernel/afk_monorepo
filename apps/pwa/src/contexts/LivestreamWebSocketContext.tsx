"use client";
import { useUIStore } from '@/store/uiStore';
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
  const {showToast} = useUIStore();
  
  const socketRef = useRef<Socket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Add refs to track current values for sendStreamData
  const streamKeyRef = useRef<string | null>(null);
  const isStreamingRef = useRef<boolean>(false);

  // Initialize socket connection
  const connect = useCallback((streamKey: string) => {
    if (socketRef.current?.connected) {
      console.log('Disconnecting existing socket...');
      socketRef.current.disconnect();
    }

    console.log('Attempting to connect to WebSocket at:', backendUrl);
    console.log('Stream key:', streamKey);
    console.log('Current connection state:', { isConnected, isStreaming, streamKey: streamKey });

    const newSocket = io(backendUrl, {
      transports: ['websocket', 'polling'],
      query: { streamKey },
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      forceNew: true
    });

    newSocket.on('connect', () => {
      showToast({ message: 'WebSocket connected successfully', type: 'success' });
      console.log('WebSocket connected successfully');
      setIsConnected(true);
      setStreamKey(streamKey);
      
      // Emit a custom event to notify components that WebSocket is connected
      window.dispatchEvent(new CustomEvent('websocket-connected', { 
        detail: { 
          streamKey,
          socketId: newSocket.id,
          timestamp: Date.now()
        } 
      }));
    });

    newSocket.on('disconnect', (reason) => {
      showToast({ message: 'WebSocket disconnected', type: 'error' });
      console.log('WebSocket disconnected:', reason);
      setIsConnected(false);
      setIsStreaming(false);
      setStreamKey(null);
      setViewerCount(0);
      
      // Emit a custom event to notify components that WebSocket is disconnected
      window.dispatchEvent(new CustomEvent('websocket-disconnected', { 
        detail: { 
          reason,
          streamKey,
          timestamp: Date.now()
        } 
      }));
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
      
      // Emit a custom event to notify components that WebSocket connection failed
      window.dispatchEvent(new CustomEvent('websocket-connection-error', { 
        detail: { 
          error: error.message || 'Connection failed',
          streamKey,
          timestamp: Date.now()
        } 
      }));
    });

    newSocket.on('stream-started', (data) => {
      console.log('Stream started:', data);
      setIsStreaming(true);
      setStreamKey(data.streamKey);
      
      // Emit a custom event to notify the HostStudio component
      window.dispatchEvent(new CustomEvent('stream-started', { detail: data }));
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

    newSocket.on('stream-data', (data) => {
      console.log('Received stream data:', data);
      // This will be handled by the video player component
      window.dispatchEvent(new CustomEvent('stream-data-received', { detail: data }));
    });

    newSocket.on('stream-joined', (data) => {
      console.log('Stream joined:', data);
      window.dispatchEvent(new CustomEvent('stream-joined', { detail: data }));
    });

    newSocket.on('stream-initialized', (data) => {
      console.log('Stream initialized with HLS data:', data);
      window.dispatchEvent(new CustomEvent('stream-initialized', { detail: data }));
    });

    newSocket.on('stream-segments-updated', (data) => {
      console.log('Stream segments updated:', data);
      window.dispatchEvent(new CustomEvent('stream-segments-updated', { detail: data }));
    });

    newSocket.on('viewer-joined', (data) => {
      console.log('Viewer joined:', data);
      setViewerCount(data.viewerCount);
    });

    newSocket.on('viewer-left', (data) => {
      console.log('Viewer left:', data);
      setViewerCount(data.viewerCount);
      
      // Emit custom event for components to listen to
      window.dispatchEvent(new CustomEvent('viewer-left', { detail: data }));
    });

    newSocket.on('stream-data-sent', (data) => {
      console.log('Stream data sent to viewers:', data);
    });

    newSocket.on('viewer-joined', (data) => {
      console.log('Viewer joined:', data);
      setViewerCount(data.viewerCount);
      
      // Emit custom event for components to listen to
      window.dispatchEvent(new CustomEvent('viewer-joined', { detail: data }));
    });

    // New stream status events
    newSocket.on('stream-ready', (data) => {
      console.log('Stream ready for broadcasting:', data);
      window.dispatchEvent(new CustomEvent('stream-ready', { detail: data }));
    });

    newSocket.on('stream-initialized', (data) => {
      console.log('Stream initialized:', data);
      window.dispatchEvent(new CustomEvent('stream-initialized', { detail: data }));
    });

    // Store the socket reference for later use
    socketRef.current = newSocket;
    console.log('🔌 Socket reference set:', { 
      socketRef: !!socketRef.current, 
      socketId: newSocket.id,
      connected: newSocket.connected 
    });
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
    try {
      console.log('🎬 startStream called with:', { streamKey, userId });
      console.log('Socket state:', { 
        socket: socketRef.current, 
        connected: socketRef.current?.connected,
        isConnected,
        socketId: socketRef.current?.id,
        socketRefExists: !!socketRef.current,
        socketConnectedProperty: socketRef.current?.connected,
        socketState: socketRef.current?.io?._readyState
      });

      if (!isConnected) {
        console.error('❌ Socket not connected (using isConnected state)');
        return;
      }

      if (!socketRef.current) {
        console.error('❌ Socket reference is null');
        return;
      }

      console.log('📡 Emitting start-stream event...');
      socketRef.current.emit('start-stream', {
        userId,
        streamKey,
        timestamp: Date.now()
      });
      console.log('✅ start-stream event emitted');
      
      // Set the stream key and streaming state immediately for this session
      setStreamKey(streamKey);
      setIsStreaming(true);
      
      // Also update refs for immediate access
      streamKeyRef.current = streamKey;
      isStreamingRef.current = true;
      
      console.log('✅ Stream state set locally:', { streamKey, isStreaming: true });
      console.log('✅ Refs updated:', { 
        streamKeyRef: streamKeyRef.current, 
        isStreamingRef: isStreamingRef.current 
      });
    } catch (error) {
      console.error('❌ Error in startStream:', error);
    }
  }, [isConnected]);

  const stopStream = useCallback(() => {
    if (!socketRef.current?.connected) {
      console.log('⚠️ Socket not connected for stop-stream');
      return;
    }

    if (!streamKey) {
      console.log('⚠️ No stream key to stop');
      return;
    }

    console.log('🛑 Stopping stream:', { streamKey, socketId: socketRef.current.id });

    socketRef.current.emit('stop-stream', { 
      streamKey,
      timestamp: Date.now()
    });
    
    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      console.log('🎬 Stopping MediaRecorder');
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }

    setIsStreaming(false);
    setStreamKey(null);
    
    // Also update refs
    streamKeyRef.current = null;
    isStreamingRef.current = false;
    
    console.log('✅ Stream stopped successfully');
  }, [streamKey]);

  const sendStreamData = useCallback((chunk: Blob) => {
    // Use refs for current values to avoid closure issues
    const currentStreamKey = streamKeyRef.current;
    const currentIsStreaming = isStreamingRef.current;
    
    console.log('🔍 sendStreamData called with refs:', {
      currentStreamKey,
      currentIsStreaming,
      socketConnected: socketRef.current?.connected
    });
    
    if (!socketRef.current?.connected || !currentIsStreaming) {
      console.log('⚠️ Cannot send stream data:', {
        socketConnected: socketRef.current?.connected,
        isStreaming: currentIsStreaming,
        streamKey: currentStreamKey
      });
      return;
    }

    console.log('📡 Sending stream data:', {
      chunkSize: chunk.size,
      chunkType: chunk.type,
      streamKey: currentStreamKey,
      socketId: socketRef.current.id
    });

    // Convert blob to buffer for WebSocket transmission
    chunk.arrayBuffer().then(buffer => {
      const data = {
        streamKey: currentStreamKey,
        chunk: Buffer.from(buffer),
        timestamp: Date.now()
      };
      
      socketRef.current?.emit('stream-data', data);
      console.log('✅ Stream data sent via WebSocket');
    }).catch(error => {
      console.error('❌ Failed to send stream data:', error);
    });
  }, []); // Remove dependencies since we're using refs

  const joinStream = useCallback((streamKey: string, userId: string) => {
    if (!socketRef.current?.connected) {
      console.error('❌ Socket not connected for join-stream');
      return;
    }

    console.log('👥 Joining stream:', { streamKey, userId, socketId: socketRef.current.id });

    socketRef.current.emit('join-stream', {
      userId,
      streamKey,
      timestamp: Date.now()
    });
    
    console.log('✅ join-stream event emitted');
  }, []);

  const leaveStream = useCallback(() => {
    if (!socketRef.current?.connected) {
      console.log('⚠️ Socket not connected for leave-stream');
      return;
    }

    if (!streamKey) {
      console.log('⚠️ No stream key to leave');
      return;
    }

    console.log('👋 Leaving stream:', { streamKey, socketId: socketRef.current.id });

    socketRef.current.emit('leave-stream', { 
      streamKey,
      timestamp: Date.now()
    });
    
    console.log('✅ leave-stream event emitted');
  }, [streamKey]);

  // Setup media stream for broadcasting
  const setupMediaStream = useCallback((mediaStream: MediaStream, streamKeyParam?: string) => {
    streamRef.current = mediaStream;
    
    // Use the passed streamKey parameter or fall back to state
    const currentStreamKey = streamKeyParam || streamKey;
    
    try {
      console.log('🎥 Setting up MediaRecorder for stream:', {
        tracks: mediaStream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled })),
        streamId: currentStreamKey
      });

      const mediaRecorder = new MediaRecorder(mediaStream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 2500000 // 2.5 Mbps
      });

      mediaRecorder.ondataavailable = (event) => {
        console.log('📡 MediaRecorder ondataavailable triggered:', {
          hasData: !!event.data,
          dataSize: event.data?.size || 0,
          dataType: event.data?.type || 'none',
          streamId: currentStreamKey,
          timestamp: Date.now()
        });
        
        if (event.data.size > 0) {
          console.log('📡 MediaRecorder data available:', {
            size: event.data.size,
            type: event.data.type,
            streamId: currentStreamKey
          });
          sendStreamData(event.data);
        } else {
          console.log('⚠️ MediaRecorder data available but size is 0');
        }
      };

      mediaRecorder.onstart = () => {
        console.log('🎬 MediaRecorder started successfully');
        console.log('🎬 MediaRecorder state after start:', {
          state: mediaRecorder.state,
          streamId: currentStreamKey,
          timestamp: Date.now()
        });
      };

      mediaRecorder.onerror = (event) => {
        console.error('❌ MediaRecorder error:', event);
        console.error('❌ MediaRecorder error details:', {
          error: event.error,
          streamId: currentStreamKey,
          timestamp: Date.now()
        });
      };

      mediaRecorder.onstop = () => {
        console.log('🛑 MediaRecorder stopped');
      };

      mediaRecorder.onpause = () => {
        console.log('⏸️ MediaRecorder paused');
      };

      mediaRecorder.onresume = () => {
        console.log('▶️ MediaRecorder resumed');
      };

      mediaRecorder.start(1000); // Send data every second
      mediaRecorderRef.current = mediaRecorder;
      
      console.log('✅ MediaRecorder setup complete');
      console.log('✅ MediaRecorder start() called with 1000ms interval');
      console.log('✅ MediaRecorder state after start() call:', {
        state: mediaRecorder.state,
        streamId: currentStreamKey,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('❌ Failed to setup media recorder:', error);
    }
  }, [sendStreamData, streamKey]);

  // Cleanup all streams
  const cleanup = useCallback(() => {
    console.log('🧹 Cleaning up all streams');
    
    // Stop any active WebSocket stream
    if (isStreaming && streamKey) {
      console.log('🛑 Cleaning up active WebSocket stream:', streamKey);
      stopStream();
    }
  }, [isStreaming, streamKey, stopStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Component unmounting, cleaning up...');
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
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
    setupMediaStream: setupMediaStream,
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
