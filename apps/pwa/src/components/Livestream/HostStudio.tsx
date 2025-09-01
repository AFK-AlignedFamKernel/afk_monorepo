'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useLivestreamWebSocket } from '@/contexts/LivestreamWebSocketContext';
import { useAuth } from 'afk_nostr_sdk';
import styles from './styles.module.scss';
import { Icon } from '../small/icon-component';

interface HostStudioProps {
  streamId: string;
  onGoLive?: () => void;
  onBack?: () => void;
}

export const HostStudio: React.FC<HostStudioProps> = ({
  streamId,
  onGoLive,
  onBack
}) => {
  const { publicKey } = useAuth();
  const {
    connect,
    disconnect,
    startStream,
    stopStream,
    setupMediaStream,
    isConnected,
    isStreaming,
    cleanup
  } = useLivestreamWebSocket();

  const [isGoingLive, setIsGoingLive] = useState(false);
  const [streamStatus, setStreamStatus] = useState<'idle' | 'connecting' | 'connected' | 'streaming' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Connect to WebSocket when component mounts
  useEffect(() => {
    if (streamId) {
      console.log('🔌 Connecting to stream:', streamId);
      setStreamStatus('connecting');
      connect(streamId);
    }

    return () => {
      cleanup();
    };
  }, [streamId, connect, cleanup]);

  // Update stream status based on WebSocket state
  useEffect(() => {
    if (isConnected && !isStreaming) {
      setStreamStatus('connected');
      setError(null);
    } else if (isStreaming) {
      setStreamStatus('streaming');
      setError(null);
    } else if (!isConnected && streamStatus !== 'idle') {
      setStreamStatus('error');
      setError('WebSocket connection failed');
    }
  }, [isConnected, isStreaming, streamStatus]);

  // Handle going live
  const handleGoLive = async () => {
    if (isGoingLive || !publicKey) return;

    try {
      setIsGoingLive(true);
      setError(null);
      console.log('🎬 Going live...');

      // Step 1: Start the stream on the backend
      startStream(streamId, publicKey);
      console.log('✅ Stream started on backend');

      // Step 2: Setup camera/screen capture
      const mediaStream = await setupCameraCapture();
      if (!mediaStream) {
        throw new Error('Failed to setup camera capture');
      }

      // Step 3: Setup MediaRecorder for streaming
      setupMediaStream(mediaStream, streamId);
      console.log('✅ MediaRecorder setup complete');

      // Step 4: Start recording
      setStreamStatus('streaming');
      console.log('🎥 Live streaming started!');

      if (onGoLive) {
        onGoLive();
      }

    } catch (err) {
      console.error('❌ Failed to go live:', err);
      setError(err instanceof Error ? err.message : 'Failed to go live');
      setStreamStatus('error');
    } finally {
      setIsGoingLive(false);
    }
  };

  // Setup camera capture
  const setupCameraCapture = async (): Promise<MediaStream | null> => {
    try {
      console.log('📹 Setting up camera capture...');
      
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      mediaStreamRef.current = stream;
      console.log('✅ Camera capture setup complete');
      
      return stream;
    } catch (err) {
      console.error('❌ Camera setup failed:', err);
      throw new Error('Camera access denied or not available');
    }
  };

  // Handle stop streaming
  const handleStopStream = () => {
    console.log('🛑 Stopping stream...');
    stopStream();
    setStreamStatus('connected');
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Handle back button
  const handleBack = () => {
    if (isStreaming) {
      handleStopStream();
    }
    disconnect();
    if (onBack) {
      onBack();
    }
  };

  // Get status display text
  const getStatusText = () => {
    switch (streamStatus) {
      case 'idle': return 'Ready to connect';
      case 'connecting': return 'Connecting...';
      case 'connected': return 'Connected - Ready to go live';
      case 'streaming': return 'LIVE - Broadcasting';
      case 'error': return 'Error - Check connection';
      default: return 'Unknown status';
    }
  };

  // Get status color
  const getStatusColor = () => {
    switch (streamStatus) {
      case 'streaming': return styles.liveStatus;
      case 'connected': return styles.readyStatus;
      case 'error': return styles.errorStatus;
      default: return styles.idleStatus;
    }
  };

  return (
    <div className={styles.hostStudio}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backButton} onClick={handleBack}>
          <Icon name="BackIcon" size={24} />
          Back
        </button>
        <h1 className={styles.title}>Host Studio</h1>
        <div className={styles.streamInfo}>
          <span className={styles.streamId}>Stream ID: {streamId}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.content}>
        {/* Video Preview */}
        <div className={styles.videoSection}>
          <div className={styles.videoContainer}>
            <video
              ref={videoRef}
              className={styles.videoPreview}
              autoPlay
              muted
              playsInline
            />
            {!mediaStreamRef.current && (
              <div className={styles.noVideo}>
                <Icon name="CameraIcon" size={48} />
                <p>Camera preview will appear here</p>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className={styles.controls}>
          {/* Status Display */}
          <div className={styles.statusSection}>
            <h3>Stream Status</h3>
            <div className={`${styles.status} ${getStatusColor()}`}>
              {getStatusText()}
            </div>
                         {error && (
               <div className={styles.error}>
                 <Icon name="WalletIcon" size={16} />
                 {error}
               </div>
             )}
          </div>

          {/* Action Buttons */}
          <div className={styles.actionButtons}>
            {streamStatus === 'connected' && (
              <button
                className={styles.goLiveButton}
                onClick={handleGoLive}
                disabled={isGoingLive}
              >
                                  {isGoingLive ? (
                    <>
                      <Icon name="LoginIcon" size={20} />
                      Going Live...
                    </>
                  ) : (
                    <>
                      <Icon name="LikeIcon" size={20} />
                      Go Live
                    </>
                  )}
              </button>
            )}

            {streamStatus === 'streaming' && (
              <button
                className={styles.stopButton}
                onClick={handleStopStream}
              >
                <Icon name="StopIcon" size={20} />
                Stop Stream
              </button>
            )}
          </div>

          {/* Connection Info */}
          <div className={styles.connectionInfo}>
            <h4>Connection Details</h4>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.label}>WebSocket:</span>
                <span className={isConnected ? styles.connected : styles.disconnected}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Stream:</span>
                <span className={isStreaming ? styles.streaming : styles.notStreaming}>
                  {isStreaming ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Camera:</span>
                <span className={mediaStreamRef.current ? styles.connected : styles.disconnected}>
                  {mediaStreamRef.current ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className={styles.instructions}>
        <h3>How to Stream</h3>
        <ol>
          <li>Allow camera access when prompted</li>
          <li>Wait for WebSocket connection (green status)</li>
          <li>Click "Go Live" to start broadcasting</li>
          <li>Your stream will be available at: <code>/livestream/{streamId}/stream.m3u8</code></li>
        </ol>
      </div>
    </div>
  );
};
