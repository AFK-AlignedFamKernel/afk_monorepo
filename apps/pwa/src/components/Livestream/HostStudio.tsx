import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth, useEditEvent, useGetSingleEvent } from 'afk_nostr_sdk';
import { useQueryClient } from '@tanstack/react-query';
import { Icon } from '../small/icon-component';
import { useUIStore } from '@/store/uiStore';
import styles from './styles.module.scss';

interface HostStudioProps {
  streamId: string;
  onBack?: () => void;
  onGoLive?: () => void;
  className?: string;
}

interface StreamSettings {
  cameraEnabled: boolean;
  microphoneEnabled: boolean;
  screenSharing: boolean;
  resolution: '720p' | '1080p' | '4k';
  bitrate: 'low' | 'medium' | 'high';
  isRecording: boolean;
}

interface MediaDevice {
  deviceId: string;
  label: string;
  kind: 'audioinput' | 'audiooutput' | 'videoinput';
}

export const HostStudio: React.FC<HostStudioProps> = ({
  streamId,
  onBack,
  onGoLive,
  className,
}) => {
  const { publicKey } = useAuth();
  const { showToast } = useUIStore();
  const queryClient = useQueryClient();

  // Debug logging for props
  useEffect(() => {
    console.log('HostStudio props:', { streamId, onBack, onGoLive, className });
    console.log('Environment variables:', {
      NEXT_PUBLIC_CLOUDFARE_BUCKET_URL: process.env.NEXT_PUBLIC_CLOUDFARE_BUCKET_URL,
    });
  }, [streamId, onBack, onGoLive, className]);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // State
  const [settings, setSettings] = useState<StreamSettings>({
    cameraEnabled: false,
    microphoneEnabled: false,
    screenSharing: false,
    resolution: '720p',
    bitrate: 'medium',
    isRecording: false,
  });

  const [isLive, setIsLive] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [viewerCount, setViewerCount] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [availableDevices, setAvailableDevices] = useState<MediaDevice[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [selectedMicrophone, setSelectedMicrophone] = useState<string>('');
  const [isGoingLive, setIsGoingLive] = useState(false);

  const updateEvent = useEditEvent();
  const { data: event, isLoading: eventLoading, error: eventError } = useGetSingleEvent({
    eventId: streamId,
  });

  // Debug logging for event data
  useEffect(() => {
    console.log('Event data:', event);
    console.log('Event loading:', eventLoading);
    console.log('Event error:', eventError);
    console.log('Stream ID:', streamId);
    console.log('Public key:', publicKey);
  }, [event, eventLoading, eventError, streamId, publicKey]);

  // Get available media devices
  const getMediaDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const mediaDevices: MediaDevice[] = devices
        .filter(device => device.kind !== 'audiooutput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `${device.kind} ${device.deviceId.slice(0, 8)}`,
          kind: device.kind as 'audioinput' | 'audiooutput' | 'videoinput',
        }));
      setAvailableDevices(mediaDevices);
    } catch (error) {
      console.error('Error getting media devices:', error);
    }
  }, []);

  useEffect(() => {
    getMediaDevices();
  }, []);

  // Start camera stream
  const startCamera = useCallback(async (deviceId?: string) => {
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          width: { ideal: settings.resolution === '720p' ? 1280 : settings.resolution === '1080p' ? 1920 : 3840 },
          height: { ideal: settings.resolution === '720p' ? 720 : settings.resolution === '1080p' ? 1080 : 2160 },
        },
        audio: settings.microphoneEnabled ? {
          deviceId: selectedMicrophone ? { exact: selectedMicrophone } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
        } : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setSettings(prev => ({ ...prev, cameraEnabled: true }));
      showToast({ message: 'Camera started', type: 'success' });
    } catch (error) {
      console.error('Error starting camera:', error);
      showToast({ message: 'Failed to start camera', type: 'error' });
    }
  }, [settings.microphoneEnabled, settings.resolution, selectedCamera, selectedMicrophone, showToast]);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setSettings(prev => ({ ...prev, cameraEnabled: false }));
  }, []);

  // Start screen sharing
  const startScreenShare = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: settings.resolution === '720p' ? 1280 : settings.resolution === '1080p' ? 1920 : 3840 },
          height: { ideal: settings.resolution === '720p' ? 720 : settings.resolution === '1080p' ? 1080 : 2160 },
        },
        audio: false,
      });

      screenStreamRef.current = screenStream;

      // Handle screen share stop
      screenStream.getVideoTracks()[0].addEventListener('ended', () => {
        stopScreenShare();
      });

      // Combine screen and camera streams
      if (streamRef.current) {
        const combinedStream = new MediaStream([
          ...screenStream.getVideoTracks(),
          ...streamRef.current.getAudioTracks(),
        ]);

        if (videoRef.current) {
          videoRef.current.srcObject = combinedStream;
        }
      } else {
        if (videoRef.current) {
          videoRef.current.srcObject = screenStream;
        }
      }

      setSettings(prev => ({ ...prev, screenSharing: true }));
      showToast({ message: 'Screen sharing started', type: 'success' });
    } catch (error) {
      console.error('Error starting screen share:', error);
      showToast({ message: 'Failed to start screen sharing', type: 'error' });
    }
  }, [settings.resolution, showToast]);

  // Stop screen sharing
  const stopScreenShare = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }

    // Restore camera stream
    if (streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }

    setSettings(prev => ({ ...prev, screenSharing: false }));
  }, []);

  // Toggle microphone
  const toggleMicrophone = useCallback(() => {
    if (!streamRef.current) return;

    const audioTracks = streamRef.current.getAudioTracks();
    audioTracks.forEach(track => {
      track.enabled = !track.enabled;
    });

    setSettings(prev => ({ ...prev, microphoneEnabled: !prev.microphoneEnabled }));
  }, []);

  // Start recording
  const startRecording = useCallback(() => {
    if (!streamRef.current && !screenStreamRef.current) {
      showToast({ message: 'No media stream available', type: 'error' });
      return;
    }

    const streamToRecord = screenStreamRef.current || streamRef.current;
    if (!streamToRecord) return;

    try {
      const mediaRecorder = new MediaRecorder(streamToRecord, {
        mimeType: 'video/webm;codecs=vp9',
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);

        // Here you would typically upload the blob to your server
        console.log('Recording completed:', url);
        showToast({ message: 'Recording saved', type: 'success' });
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;

      setSettings(prev => ({ ...prev, isRecording: true }));

      // Start recording timer
      const interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Store interval ID for cleanup
      (mediaRecorder as any).intervalId = interval;

      showToast({ message: 'Recording started', type: 'success' });
    } catch (error) {
      console.error('Error starting recording:', error);
      showToast({ message: 'Failed to start recording', type: 'error' });
    }
  }, [showToast]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      clearInterval((mediaRecorderRef.current as any).intervalId);
      setRecordingTime(0);
      setSettings(prev => ({ ...prev, isRecording: false }));
      showToast({ message: 'Recording stopped', type: 'info' });
    }
  }, [showToast]);

  // Go live
  const handleGoLive = useCallback(() => {
    if (!streamRef.current && !screenStreamRef.current) {
      showToast({ message: 'Please start camera or screen sharing first', type: 'error' });
      return;
    }

    if (!streamId) {
      showToast({ message: 'No event ID available', type: 'error' });
      return;
    }

    if (!event) {
      showToast({ message: 'Event data not loaded', type: 'error' });
      return;
    }
    // Use a fallback URL if environment variable is not set
    const baseUrl = process.env.NEXT_PUBLIC_CLOUDFARE_BUCKET_URL || "http://localhost:5050";
    console.log('baseUrl', baseUrl);
    if (!baseUrl) {
      showToast({ message: 'Streaming URL not configured. Please set NEXT_PUBLIC_CLOUDFARE_BUCKET_URL environment variable.', type: 'error' });
      return;
    }
    const streamingUrl = `${baseUrl}/livestream/${streamId}/stream.m3u8`;

    console.log('Attempting to go live with:', {
      eventId: streamId,
      status: 'live',
      streamingUrl,
      shouldMarkDelete: false,
    });

    setIsGoingLive(true);
    
    updateEvent.mutate(
      {
        eventId: streamId,
        status: 'live',
        streamingUrl,
        shouldMarkDelete: false,
      },
      {
        onSuccess() {
          console.log('Successfully went live!');
          setIsLive(true);
          setIsStreaming(true);
          setIsGoingLive(false);
          showToast({ message: 'You are now live!', type: 'success' });
          onGoLive?.();
        },
        onError(error) {
          console.error('Failed to go live:', error);
          setIsGoingLive(false);
          showToast({ message: `Failed to go live: ${error?.message || 'Unknown error'}`, type: 'error' });
        },
      }
    );
  }, [streamId, event, updateEvent, showToast, onGoLive]);

  // Stop streaming
  const stopStreaming = useCallback(() => {
    if (!streamId) {
      showToast({ message: 'No event ID available', type: 'error' });
      return;
    }

    console.log('Attempting to stop streaming for event:', streamId);
    
    updateEvent.mutate(
      {
        eventId: streamId,
        status: 'ended',
        shouldMarkDelete: false,
      },
      {
        onSuccess() {
          console.log('Successfully stopped streaming');
          setIsLive(false);
          setIsStreaming(false);
          showToast({ message: 'Stream ended', type: 'info' });
        },
        onError(error) {
          console.error('Failed to stop stream:', error);
          showToast({ message: `Failed to stop stream: ${error?.message || 'Unknown error'}`, type: 'error' });
        },
      }
    );
  }, [streamId, updateEvent, showToast]);

  // Format recording time
  const formatTime = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return (
    <div className={`${styles.hostStudio} ${className || ''}`}>
      {/* Header */}
      <div className={styles.studioHeader}>
        <button
          className={styles.backButton}
          onClick={onBack}
          aria-label="Back"
        >
          <Icon name="BackIcon" size={24} />
        </button>

        <div className={styles.streamInfo}>
          <h1 className={styles.streamTitle}>{event?.title || 'Host Studio'}</h1>
          <div className={styles.statusIndicators}>
            {isLive && (
              <span className={styles.liveIndicator}>
                <span className={styles.liveDot}></span>
                LIVE
              </span>
            )}
            {settings.isRecording && (
              <span className={styles.recordingIndicator}>
                <Icon name="RecordIcon" size={16} />
                {formatTime(recordingTime)}
              </span>
            )}
            <span className={styles.viewerCount}>
              <Icon name="EyeIcon" size={16} />
              {viewerCount}
            </span>
          </div>
        </div>

        <button
          className={styles.settingsButton}
          onClick={() => setShowSettings(!showSettings)}
          aria-label="Settings"
        >
          <Icon name="SettingsIcon" size={24} />
        </button>
      </div>

      {/* Main Content */}
      <div className={styles.studioContent}>
        {/* Video Preview */}
        <div className={styles.previewSection}>
          <div className={styles.videoContainer}>
            <video
              ref={videoRef}
              className={styles.previewVideo}
              autoPlay
              muted
              playsInline
            />
            <canvas ref={canvasRef} className={styles.canvas} />

            {!settings.cameraEnabled && !settings.screenSharing && (
              <div className={styles.noVideo}>
                <Icon name="CameraIcon" size={48} />
                <p>Start camera or screen sharing to begin</p>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className={styles.controlsSection}>
          <div className={styles.mediaControls}>
            {/* Camera Control */}
            <button
              className={`${styles.mediaButton} ${settings.cameraEnabled ? styles.active : ''}`}
              onClick={settings.cameraEnabled ? stopCamera : () => startCamera()}
              aria-label={settings.cameraEnabled ? 'Stop camera' : 'Start camera'}
            >
              <Icon name="CameraIcon" size={20} />
              <span>Camera</span>
            </button>

            {/* Microphone Control */}
            <button
              className={`${styles.mediaButton} ${settings.microphoneEnabled ? styles.active : ''}`}
              onClick={toggleMicrophone}
              disabled={!settings.cameraEnabled}
              aria-label={settings.microphoneEnabled ? 'Mute microphone' : 'Unmute microphone'}
            >
              <Icon name={settings.microphoneEnabled ? 'MicIcon' : 'MicOffIcon'} size={20} />
              <span>Mic</span>
            </button>

            {/* Screen Share Control */}
            <button
              className={`${styles.mediaButton} ${settings.screenSharing ? styles.active : ''}`}
              onClick={settings.screenSharing ? stopScreenShare : startScreenShare}
              aria-label={settings.screenSharing ? 'Stop screen sharing' : 'Start screen sharing'}
            >
              <Icon name="MonitorIcon" size={20} />
              <span>Screen</span>
            </button>

            {/* Recording Control */}
            <button
              className={`${styles.mediaButton} ${settings.isRecording ? styles.recording : ''}`}
              onClick={settings.isRecording ? stopRecording : startRecording}
              disabled={!settings.cameraEnabled && !settings.screenSharing}
              aria-label={settings.isRecording ? 'Stop recording' : 'Start recording'}
            >
              <Icon name="RecordIcon" size={20} />
              <span>Record</span>
            </button>
          </div>

          {/* Stream Controls */}
          <div className={styles.streamControls}>
            {!isLive ? (
              <button
                className={`${styles.streamButton} ${styles.goLiveButton}`}
                onClick={handleGoLive}
                disabled={(!settings.cameraEnabled && !settings.screenSharing) || isGoingLive || !streamId || !event}
              >
                {isGoingLive ? (
                  <>
                    <div className={styles.spinner}></div>
                    <span>Going Live...</span>
                  </>
                ) : (
                  <>
                    <Icon name="PlayIcon" size={20} />
                    <span>Go Live</span>
                  </>
                )}
              </button>
            ) : (
              <button
                className={`${styles.streamButton} ${styles.endStreamButton}`}
                onClick={stopStreaming}
              >
                <Icon name="StopIcon" size={20} />
                <span>End Stream</span>
              </button>
            )}
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className={styles.settingsPanel}>
            <h3>Stream Settings</h3>

            {/* Device Selection */}
            <div className={styles.settingGroup}>
              <label>Camera</label>
              <select
                value={selectedCamera}
                onChange={(e) => setSelectedCamera(e.target.value)}
                className={styles.select}
              >
                <option value="">Default Camera</option>
                {availableDevices
                  .filter(device => device.kind === 'videoinput')
                  .map(device => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label}
                    </option>
                  ))}
              </select>
            </div>

            <div className={styles.settingGroup}>
              <label>Microphone</label>
              <select
                value={selectedMicrophone}
                onChange={(e) => setSelectedMicrophone(e.target.value)}
                className={styles.select}
              >
                <option value="">Default Microphone</option>
                {availableDevices
                  .filter(device => device.kind === 'audioinput')
                  .map(device => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label}
                    </option>
                  ))}
              </select>
            </div>

            {/* Quality Settings */}
            <div className={styles.settingGroup}>
              <label>Resolution</label>
              <select
                value={settings.resolution}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  resolution: e.target.value as '720p' | '1080p' | '4k'
                }))}
                className={styles.select}
              >
                <option value="720p">720p</option>
                <option value="1080p">1080p</option>
                <option value="4k">4K</option>
              </select>
            </div>

            <div className={styles.settingGroup}>
              <label>Bitrate</label>
              <select
                value={settings.bitrate}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  bitrate: e.target.value as 'low' | 'medium' | 'high'
                }))}
                className={styles.select}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
