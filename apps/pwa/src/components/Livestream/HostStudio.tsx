'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useLivestreamWebSocket } from '@/contexts/LivestreamWebSocketContext';
import { useAuth } from 'afk_nostr_sdk';
import { useLiveActivity } from 'afk_nostr_sdk';
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

  // NIP-53 Live Activity management
  const { createEvent, updateEvent } = useLiveActivity();

  const [isGoingLive, setIsGoingLive] = useState(false);
  const [streamStatus, setStreamStatus] = useState<'idle' | 'connecting' | 'connected' | 'streaming' | 'error' | 'loading'>('idle');
  const [error, setError] = useState<string | null>(null);
  
  // Media stream states
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [microphoneEnabled, setMicrophoneEnabled] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [currentMediaStream, setCurrentMediaStream] = useState<MediaStream | null>(null);

  // Real-time stream monitoring
  const [backendStreamStatus, setBackendStreamStatus] = useState<'inactive' | 'active' | 'live' | 'error'>('inactive');
  const [streamDetails, setStreamDetails] = useState<any>(null);

  // NIP-53 event state
  const [liveEventId, setLiveEventId] = useState<string | null>(null);

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
      console.log('🧹 Cleaning up WebSocket connection');
      cleanup();
    };
  }, [streamId]); // Remove connect and cleanup from dependencies to prevent infinite loops

  // Update stream status based on WebSocket state
  useEffect(() => {
    console.log('🔄 WebSocket state changed:', { isConnected, isStreaming, currentStreamStatus: streamStatus });
    
    if (isConnected && !isStreaming) {
      setStreamStatus('connected');
      setError(null);
      setBackendStreamStatus('inactive'); // Reset backend status when not streaming
      console.log('✅ Stream status set to: connected');
    } else if (isStreaming) {
      setStreamStatus('streaming');
      setError(null);
      console.log('🎬 Stream status set to: streaming');
    } else if (!isConnected && streamStatus !== 'idle') {
      setStreamStatus('error');
      setError('WebSocket connection failed');
      setBackendStreamStatus('error');
      console.log('❌ Stream status set to: error');
    }
  }, [isConnected, isStreaming, streamStatus]);

  // Real-time stream monitoring for backend status
  useEffect(() => {
    if (!streamId || !isConnected) return;

    console.log('🎬 Setting up real-time stream monitoring for:', streamId);
    
    const statusCheckInterval = setInterval(async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5050';
        const response = await fetch(`${backendUrl}/livestream/${streamId}/status`);
        
        if (response.ok) {
          const status = await response.json();
          console.log('📊 HostStudio stream status check:', status);
          setStreamDetails(status);
          
          // Update backend stream status
          if (status.overall?.isEnded) {
            console.log('🛑 Stream has ended');
            setBackendStreamStatus('inactive');
          } else if (status.overall?.hasVideoContent && status.overall?.hasManifest) {
            console.log('🎬 Stream is LIVE with video content and manifest!');
            setBackendStreamStatus('live');
          } else if (status.overall?.isActive && status.overall?.hasManifest && !status.overall?.hasVideoContent) {
            console.log('⏳ Stream is active with manifest but no video content yet');
            setBackendStreamStatus('active');
          } else if (status.overall?.isActive && !status.overall?.hasManifest) {
            console.log('⏳ Stream is active but no manifest yet');
            setBackendStreamStatus('active');
          } else {
            console.log('❌ Stream is not active');
            setBackendStreamStatus('inactive');
          }
        } else {
          console.log('❌ Failed to get stream status');
          setBackendStreamStatus('error');
        }
      } catch (error) {
        console.error('❌ Error checking stream status:', error);
        setBackendStreamStatus('error');
      }
    }, 2000); // Check every 2 seconds

    return () => {
      clearInterval(statusCheckInterval);
    };
  }, [streamId, isConnected]);

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

      // Step 1: Create NIP-53 Live Event
      console.log('📝 Creating NIP-53 live event...');
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5050';
      const streamingUrl = `${backendUrl}/livestream/${streamId}/stream.m3u8`;
      
      const liveEventData = {
        identifier: streamId,
        title: `Live Stream - ${streamId.slice(0, 8)}`,
        summary: 'Live streaming session',
        streamingUrl: streamingUrl,
        startsAt: Math.floor(Date.now() / 1000),
        status: 'live' as const,
        currentParticipants: 1,
        totalParticipants: 1,
        participants: [{
          pubkey: publicKey,
          role: 'Host' as const,
          relay: '',
          proof: ''
        }],
        hashtags: ['livestream', 'afk'],
        relays: []
      };

      console.log('✅ NIP-53 live event created:', streamId);

      await updateEvent.mutateAsync({
        eventId: streamId,
        status: 'live',
        startsAt: Math.floor(Date.now() / 1000),
        currentParticipants: 0
      });

      // Step 2: Start the stream on the backend
      startStream(streamId, publicKey);
      console.log('✅ Stream started on backend');

      // Step 3: Setup MediaRecorder for streaming
      if (currentMediaStream) {
        setupMediaStream(currentMediaStream, streamId);
        console.log('✅ MediaRecorder setup complete');
      }

      // Step 4: Start recording
      setStreamStatus('streaming');
      console.log('🎥 Live streaming started!');

      // Step 5: Load the actual HLS stream for preview
      setTimeout(() => {
        loadHLSStream();
      }, 1000); // Wait a bit for the stream to start

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

  // Load the actual HLS stream for preview
  const loadHLSStream = () => {
    if (!videoRef.current || !streamId) return;
    
    try {
      console.log('🎥 Loading HLS stream for preview:', streamId);
      
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5050';
      const hlsUrl = `${backendUrl}/livestream/${streamId}/stream.m3u8`;
      
      console.log('🔗 HLS URL:', hlsUrl);
      
      const video = videoRef.current;
      
      // Set HLS stream as source
      video.src = hlsUrl;
      video.load();
      
      // Try to play the stream
      video.play().catch(error => {
        console.warn('🎥 Auto-play failed for HLS stream:', error);
      });
      
      console.log('✅ HLS stream loaded for preview');
      
    } catch (error) {
      console.error('❌ Error loading HLS stream:', error);
    }
  };

  // Handle stop streaming
  const handleStopStream = async () => {
    console.log('🛑 Stopping stream...');
    
    // Step 1: Update NIP-53 event to ended status
    if (liveEventId) {
      try {
        console.log('📝 Updating NIP-53 event to ended status...');
        await updateEvent.mutateAsync({
          eventId: liveEventId,
          status: 'ended',
          endsAt: Math.floor(Date.now() / 1000),
          currentParticipants: 0
        });
        console.log('✅ NIP-53 event updated to ended status');
      } catch (error) {
        console.error('❌ Failed to update NIP-53 event:', error);
      }
    }
    
    // Step 2: Stop the backend stream
    stopStream(publicKey || 'current-user');
    setStreamStatus('connected');
    
    // Step 3: Clean up media streams
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.src = ''; // Clear the HLS source
      videoRef.current.load(); // Reload the video element
    }

    // Step 4: Reset all states
    setCurrentMediaStream(null);
    setCameraEnabled(false);
    setMicrophoneEnabled(false);
    setScreenSharing(false);
    setBackendStreamStatus('inactive');
    setLiveEventId(null);
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
      case 'loading': return 'Loading...';
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

  // Get backend stream status color
  const getBackendStatusColor = () => {
    switch (backendStreamStatus) {
      case 'inactive':
        return styles.disconnected || styles.errorStatus;
      case 'active':
        return styles.readyStatus;
      case 'live':
        return styles.liveStatus;
      case 'error':
        return styles.errorStatus;
      default:
        return styles.idleStatus;
    }
  };

  // Get backend stream status text
  const getBackendStatusText = () => {
    switch (backendStreamStatus) {
      case 'inactive':
        return 'Not Started';
      case 'active':
        return 'Starting...';
      case 'live':
        return 'LIVE';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className={styles.hostStudio}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backButton} onClick={handleBack} aria-label="Go back">
          <Icon name="BackIcon" size={20} />
          <span className={styles.backText}>Back</span>
        </button>
        <h1 className={styles.title}>Host Studio</h1>
        <div className={styles.streamInfo}>
          <span className={styles.streamId}>{streamId.slice(0, 8)}...</span>
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
              aria-label="Stream preview"
            />
            {!currentMediaStream && !isStreaming && (
              <div className={styles.noVideo}>
                <Icon name="CameraIcon" size={48} />
                <p>Select camera or screen sharing to begin</p>
              </div>
            )}
            
            {/* Show stream status when streaming */}
            {isStreaming && (
              <div className={styles.streamStatus}>
                <div className={styles.statusIcon}>🎬</div>
                <h3>Streaming Live</h3>
                <p>Your stream is now live and being broadcast!</p>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className={styles.controls}>
          {/* Media Controls */}
          <div className={styles.mediaControls}>
            <h3 className={styles.mediaControlsTitle}>Media Sources</h3>
            <div className={styles.mediaButtons}>
              <button
                className={`${styles.mediaButton} ${cameraEnabled ? styles.active : ''}`}
                onClick={switchToCamera}
                disabled={isStreaming}
                aria-label={cameraEnabled ? "Camera active" : "Enable camera"}
              >
                <Icon name="CameraIcon" size={24} />
                <span>Camera</span>
              </button>
              
              <button
                className={`${styles.mediaButton} ${screenSharing ? styles.active : ''}`}
                onClick={switchToScreen}
                disabled={isStreaming}
                aria-label={screenSharing ? "Screen sharing active" : "Enable screen sharing"}
              >
                <Icon name="MonitorIcon" size={24} />
                <span>Screen</span>
              </button>
              
              <button
                className={`${styles.mediaButton} ${microphoneEnabled ? styles.active : ''}`}
                onClick={toggleMicrophone}
                disabled={!currentMediaStream || isStreaming}
                aria-label={microphoneEnabled ? "Microphone active" : "Enable microphone"}
              >
                <Icon name={microphoneEnabled ? "MicIcon" : "MicOffIcon"} size={24} />
                <span>{microphoneEnabled ? 'Mute' : 'Unmute'}</span>
              </button>
            </div>
          </div>

          {/* Status Display */}
          <div className={styles.statusSection}>
            <div className={`${styles.status} ${getStatusColor()}`}>
              {getStatusText()}
            </div>
            
            {/* Backend Status */}
            <div className={`${styles.status} ${getBackendStatusColor()}`}>
              Backend: {getBackendStatusText()}
            </div>
            
            {error && (
              <div className={styles.error}>
                <Icon name="WalletIcon" size={16} />
                {error}
              </div>
            )}
            
            {/* Additional status info */}
            {streamDetails && (
              <div className={styles.statusInfo}>
                <p>Manifest: {streamDetails.overall?.hasManifest ? '✅' : '❌'}</p>
                <p>Video Content: {streamDetails.overall?.hasVideoContent ? '✅' : '❌'}</p>
                <p>Active: {streamDetails.overall?.isActive ? '✅' : '❌'}</p>
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
                aria-label={isGoingLive ? "Going live..." : "Start streaming"}
              >
                {isGoingLive ? (
                  <>
                    <div className={styles.loadingSpinner}></div>
                    <span>Going Live...</span>
                  </>
                ) : (
                  <>
                    <Icon name="PlayIcon" size={20} />
                    <span>Go Live</span>
                  </>
                )}
              </button>
            )}

            {streamStatus === 'streaming' && (
              <button
                className={styles.stopButton}
                onClick={handleStopStream}
                aria-label="Stop streaming"
              >
                <Icon name="StopIcon" size={20} />
                <span>Stop Stream</span>
              </button>
            )}
          </div>

          {/* Connection Info - Simplified */}
          <div className={styles.connectionInfo}>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.label}>Connection:</span>
                <span className={isConnected ? styles.connected : styles.disconnected}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Stream:</span>
                <span className={getBackendStatusColor()}>
                  {getBackendStatusText()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
