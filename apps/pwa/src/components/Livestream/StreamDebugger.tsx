'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useLivestreamWebSocket } from '@/contexts/LivestreamWebSocketContext';
import styles from './styles.module.scss';

interface StreamDebuggerProps {
  streamId: string;
  isHost?: boolean;
}

export const StreamDebugger: React.FC<StreamDebuggerProps> = ({ streamId, isHost = false }) => {
  const { 
    socket, 
    isConnected, 
    isStreaming, 
    streamKey, 
    viewerCount,
    setupMediaStream,
    sendStreamData
  } = useLivestreamWebSocket();
  
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [streamStatus, setStreamStatus] = useState<any>(null);
  const [hlsStatus, setHlsStatus] = useState<any>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [chunkCount, setChunkCount] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setDebugLogs(prev => [...prev, logMessage]);
    console.log(logMessage);
  };

  // Auto-scroll to bottom of logs
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [debugLogs]);

  // Check stream status
  const checkStreamStatus = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5050';
      const response = await fetch(`${backendUrl}/livestream/${streamId}/status`);
      
      if (response.ok) {
        const status = await response.json();
        setStreamStatus(status);
        addLog(`📊 Stream Status: ${JSON.stringify(status, null, 2)}`);
      } else {
        addLog(`❌ Stream status check failed: ${response.status}`);
      }
    } catch (error) {
      addLog(`❌ Stream status error: ${error}`);
    }
  };

  // Check HLS manifest
  const checkHLSManifest = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5050';
      const response = await fetch(`${backendUrl}/livestream/${streamId}/stream.m3u8`);
      
      if (response.ok) {
        const manifest = await response.text();
        setHlsStatus({ manifest, length: manifest.length });
        addLog(`📋 HLS Manifest: ${manifest.length} chars`);
        addLog(`📋 Manifest content: ${manifest.substring(0, 200)}...`);
      } else {
        addLog(`❌ HLS manifest check failed: ${response.status}`);
      }
    } catch (error) {
      addLog(`❌ HLS manifest error: ${error}`);
    }
  };

  // Setup camera for testing
  const setupCamera = async () => {
    try {
      addLog('📹 Setting up camera...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, frameRate: 30 },
        audio: true
      });
      
      setMediaStream(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      addLog('✅ Camera setup complete');
    } catch (error) {
      addLog(`❌ Camera setup failed: ${error}`);
    }
  };

  // Setup screen sharing for testing
  const setupScreenShare = async () => {
    try {
      addLog('🖥️ Setting up screen sharing...');
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      
      setMediaStream(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      addLog('✅ Screen sharing setup complete');
    } catch (error) {
      addLog(`❌ Screen sharing setup failed: ${error}`);
    }
  };

  // Start MediaRecorder for testing
  const startRecording = () => {
    if (!mediaStream) {
      addLog('❌ No media stream available');
      return;
    }

    try {
      addLog('🎬 Starting MediaRecorder...');
      
      const supportedTypes = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
      let selectedMimeType: string | null = null;
      
      for (const type of supportedTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          selectedMimeType = type;
          break;
        }
      }
      
      if (!selectedMimeType) {
        addLog('❌ No supported video format found');
        return;
      }

      addLog(`📹 Using MIME type: ${selectedMimeType}`);

      const mediaRecorder = new MediaRecorder(mediaStream, {
        mimeType: selectedMimeType,
        videoBitsPerSecond: 2500000
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          setChunkCount(prev => prev + 1);
          setTotalBytes(prev => prev + event.data.size);
          addLog(`📡 Chunk ${chunkCount + 1}: ${event.data.size} bytes (Total: ${totalBytes + event.data.size} bytes)`);
          
          // Send to WebSocket if connected
          if (socket?.connected) {
            sendStreamData(event.data);
            addLog(`📡 Sent chunk to WebSocket`);
          } else {
            addLog(`❌ WebSocket not connected, cannot send chunk`);
          }
        }
      };

      mediaRecorder.onstart = () => {
        addLog('✅ MediaRecorder started');
        setIsRecording(true);
      };

      mediaRecorder.onerror = (event) => {
        addLog(`❌ MediaRecorder error: ${event}`);
      };

      mediaRecorder.onstop = () => {
        addLog('🛑 MediaRecorder stopped');
        setIsRecording(false);
      };

      mediaRecorder.start(1000); // Send data every second
      mediaRecorderRef.current = mediaRecorder;
      
      addLog('✅ MediaRecorder setup complete');
      
    } catch (error) {
      addLog(`❌ MediaRecorder setup failed: ${error}`);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
      addLog('🛑 Recording stopped');
    }
  };

  // Test WebSocket connection
  const testWebSocket = () => {
    if (socket?.connected) {
      addLog('✅ WebSocket is connected');
      addLog(`🔌 Socket ID: ${socket.id}`);
      addLog(`📡 Stream Key: ${streamKey}`);
    } else {
      addLog('❌ WebSocket is not connected');
    }
  };

  // Clear logs
  const clearLogs = () => {
    setDebugLogs([]);
  };

  return (
    <div className={styles.container}>
      <div className={styles.scrollContent}>
        <h1 className={styles.headerText}>Stream Debugger</h1>
        
        <div className={styles.section}>
          <h2>Connection Status</h2>
          <div className={styles.statusGrid}>
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>WebSocket:</span>
              <span className={isConnected ? styles.statusConnected : styles.statusDisconnected}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>Streaming:</span>
              <span className={isStreaming ? styles.statusConnected : styles.statusDisconnected}>
                {isStreaming ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>Viewers:</span>
              <span className={styles.statusValue}>{viewerCount}</span>
            </div>
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>Recording:</span>
              <span className={isRecording ? styles.statusConnected : styles.statusDisconnected}>
                {isRecording ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>Chunks:</span>
              <span className={styles.statusValue}>{chunkCount}</span>
            </div>
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>Total Bytes:</span>
              <span className={styles.statusValue}>{totalBytes.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2>Test Controls</h2>
          <div className={styles.buttonGrid}>
            <button onClick={testWebSocket} className={styles.testButton}>
              Test WebSocket
            </button>
            <button onClick={checkStreamStatus} className={styles.testButton}>
              Check Stream Status
            </button>
            <button onClick={checkHLSManifest} className={styles.testButton}>
              Check HLS Manifest
            </button>
            <button onClick={setupCamera} className={styles.testButton}>
              Setup Camera
            </button>
            <button onClick={setupScreenShare} className={styles.testButton}>
              Setup Screen Share
            </button>
            <button onClick={startRecording} className={styles.testButton} disabled={!mediaStream}>
              Start Recording
            </button>
            <button onClick={stopRecording} className={styles.testButton} disabled={!isRecording}>
              Stop Recording
            </button>
            <button onClick={clearLogs} className={styles.testButton}>
              Clear Logs
            </button>
          </div>
        </div>

        <div className={styles.section}>
          <h2>Video Preview</h2>
          <div className={styles.videoContainer}>
            <video
              ref={videoRef}
              className={styles.debugVideo}
              autoPlay
              muted
              playsInline
            />
          </div>
        </div>

        <div className={styles.section}>
          <h2>Debug Logs</h2>
          <div ref={logRef} className={styles.debugLogs}>
            {debugLogs.map((log, index) => (
              <div key={index} className={styles.logLine}>
                {log}
              </div>
            ))}
          </div>
        </div>

        {streamStatus && (
          <div className={styles.section}>
            <h2>Stream Status</h2>
            <pre className={styles.jsonDisplay}>
              {JSON.stringify(streamStatus, null, 2)}
            </pre>
          </div>
        )}

        {hlsStatus && (
          <div className={styles.section}>
            <h2>HLS Status</h2>
            <pre className={styles.jsonDisplay}>
              {JSON.stringify(hlsStatus, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
