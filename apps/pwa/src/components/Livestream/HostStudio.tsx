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
  
  // Media stream states
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [microphoneEnabled, setMicrophoneEnabled] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [currentMediaStream, setCurrentMediaStream] = useState<MediaStream | null>(null);

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
      setCurrentMediaStream(stream);
      setCameraEnabled(true);
      setMicrophoneEnabled(true);
      console.log('✅ Camera capture setup complete');
      
      return stream;
    } catch (err) {
      console.error('❌ Camera setup failed:', err);
      throw new Error('Camera access denied or not available');
    }
  };

  // Setup screen sharing
  const setupScreenSharing = async (): Promise<MediaStream | null> => {
    try {
      console.log('🖥️ Setting up screen sharing...');
      
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: microphoneEnabled
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      mediaStreamRef.current = stream;
      setCurrentMediaStream(stream);
      setScreenSharing(true);
      setCameraEnabled(false);
      console.log('✅ Screen sharing setup complete');
      
      return stream;
    } catch (err) {
      console.error('❌ Screen sharing setup failed:', err);
      throw new Error('Screen sharing access denied or not available');
    }
  };

  // Toggle microphone
  const toggleMicrophone = async () => {
    if (!currentMediaStream) return;

    try {
      const audioTracks = currentMediaStream.getAudioTracks();
      if (audioTracks.length > 0) {
        const audioTrack = audioTracks[0];
        audioTrack.enabled = !audioTrack.enabled;
        setMicrophoneEnabled(audioTrack.enabled);
        console.log('🎤 Microphone:', audioTrack.enabled ? 'enabled' : 'disabled');
      }
    } catch (err) {
      console.error('❌ Failed to toggle microphone:', err);
    }
  };

  // Switch between camera and screen
  const switchToCamera = async () => {
    if (screenSharing) {
      // Stop screen sharing
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      setScreenSharing(false);
    }
    
    // Setup camera
    await setupCameraCapture();
  };

  const switchToScreen = async () => {
    if (cameraEnabled) {
      // Stop camera
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      setCameraEnabled(false);
      setMicrophoneEnabled(false);
    }
    
    // Setup screen sharing
    await setupScreenSharing();
  };

  // Handle going live
  const handleGoLive = async () => {
    if (isGoingLive || !publicKey) return;

    try {
      setIsGoingLive(true);
      setError(null);
      console.log('🎬 Going live...');

      // Ensure we have a media stream
      if (!currentMediaStream) {
        await setupCameraCapture();
      }

      // Step 1: Start the stream on the backend
      startStream(streamId, publicKey);
      console.log('✅ Stream started on backend');

      // Step 2: Setup MediaRecorder for streaming
      if (currentMediaStream) {
        setupMediaStream(currentMediaStream, streamId);
        console.log('✅ MediaRecorder setup complete');
      }

      // Step 3: Start recording
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

    setCurrentMediaStream(null);
    setCameraEnabled(false);
    setMicrophoneEnabled(false);
    setScreenSharing(false);
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
            {!currentMediaStream && (
              <div className={styles.noVideo}>
                <Icon name="CameraIcon" size={48} />
                <p>Select camera or screen sharing to begin</p>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className={styles.controls}>
          {/* Media Controls */}
          <div className={styles.mediaControls}>
            <h3>Media Sources</h3>
            <div className={styles.mediaButtons}>
              <button
                className={`${styles.mediaButton} ${cameraEnabled ? styles.active : ''}`}
                onClick={switchToCamera}
                disabled={isStreaming}
              >
                <Icon name="CameraIcon" size={20} />
                Camera
              </button>
              
              <button
                className={`${styles.mediaButton} ${screenSharing ? styles.active : ''}`}
                onClick={switchToScreen}
                disabled={isStreaming}
              >
                <Icon name="MonitorIcon" size={20} />
                Screen Share
              </button>
              
              <button
                className={`${styles.mediaButton} ${microphoneEnabled ? styles.active : ''}`}
                onClick={toggleMicrophone}
                disabled={!currentMediaStream || isStreaming}
              >
                <Icon name={microphoneEnabled ? "MicIcon" : "MicOffIcon"} size={20} />
                {microphoneEnabled ? 'Mute' : 'Unmute'}
              </button>
            </div>
          </div>

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
            {streamStatus === 'connected' && currentMediaStream && (
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
                <span className={cameraEnabled ? styles.connected : styles.disconnected}>
                  {cameraEnabled ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Screen:</span>
                <span className={screenSharing ? styles.connected : styles.disconnected}>
                  {screenSharing ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Microphone:</span>
                <span className={microphoneEnabled ? styles.connected : styles.disconnected}>
                  {microphoneEnabled ? 'Active' : 'Inactive'}
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
          <li>Select camera or screen sharing as your media source</li>
          <li>Allow camera/screen access when prompted</li>
          <li>Wait for WebSocket connection (green status)</li>
          <li>Click "Go Live" to start broadcasting</li>
          <li>Your stream will be available at: <code>/livestream/{streamId}/stream.m3u8</code></li>
        </ol>
      </div>
    </div>
  );
};
