import React, { useEffect, useState } from 'react';
import { Icon } from '../small/icon-component';
import { useVideoElement } from '@/hooks/useVideoElement';
import { useLivestreamWebSocket } from '@/contexts/LivestreamWebSocketContext';
import styles from './styles.module.scss';

interface StreamVideoPlayerProps {
  streamingUrl?: string;
  recordingUrl?: string;
  isStreamer?: boolean;
  onStreamStart?: () => void;
  onStreamStop?: () => void;
  onStreamError?: (error: string) => void;
  className?: string;
  streamId?: string;
}

export const StreamVideoPlayer: React.FC<StreamVideoPlayerProps> = ({
  streamingUrl,
  recordingUrl,
  isStreamer = false,
  onStreamStart,
  onStreamStop,
  onStreamError,
  className,
  streamId,
}) => {
  const { isStreaming, streamKey, joinStream, leaveStream } = useLivestreamWebSocket();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);

  // Debug: Log the props received
  useEffect(() => {
    console.log('🎥 StreamVideoPlayer received props:', {
      streamingUrl,
      recordingUrl,
      isStreamer,
      className,
      isStreaming,
      streamKey,
      streamId
    });
  }, [streamingUrl, recordingUrl, isStreamer, className, isStreaming, streamKey, streamId]);

  // Auto-join stream for viewers when streamId is available
  useEffect(() => {
    if (streamId && !isStreamer && !isStreaming) {
      console.log('👥 Auto-joining stream as viewer:', streamId);
      joinStream(streamId, 'viewer');
    }
  }, [streamId, isStreamer, isStreaming, joinStream]);

  // Listen for stream events
  useEffect(() => {
    const handleStreamJoined = (event: CustomEvent) => {
      console.log('✅ Stream joined successfully:', event.detail);
      setViewerCount(event.detail.viewerCount || 0);
    };

    const handleStreamData = (event: CustomEvent) => {
      console.log('📺 Received stream data:', event.detail);
      // Handle incoming stream data if needed
    };

    const handleViewerCountUpdate = (event: CustomEvent) => {
      console.log('👥 Viewer count updated:', event.detail);
      setViewerCount(event.detail.count || 0);
    };

    window.addEventListener('stream-joined', handleStreamJoined as EventListener);
    window.addEventListener('stream-data-received', handleStreamData as EventListener);
    window.addEventListener('viewer-count-update', handleViewerCountUpdate as EventListener);

    return () => {
      window.removeEventListener('stream-joined', handleStreamJoined as EventListener);
      window.removeEventListener('stream-data-received', handleStreamData as EventListener);
      window.removeEventListener('viewer-count-update', handleViewerCountUpdate as EventListener);
    };
  }, []);

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      if (streamId && !isStreamer) {
        console.log('👋 Leaving stream as viewer:', streamId);
        leaveStream();
      }
    };
  }, [streamId, isStreamer, leaveStream]);

  console.log("streamingUrl", streamingUrl);
  console.log("recordingUrl", recordingUrl);
  console.log("isStreamer", isStreamer);
  console.log("onStreamStart", onStreamStart);
  console.log("onStreamStop", onStreamStop);
  console.log("className", className);

  // Use video element hook for stream management
  const {
    videoRef,
    play,
    pause,
    togglePlayPause,
    setVolume: setVideoVolume,
    toggleMute,
    getCurrentTime,
    getDuration,
    seekTo,
  } = useVideoElement({});

  // Error handling function
  const handleVideoError = (event: Event) => {
    const videoElement = event.target as HTMLVideoElement;
    const error = videoElement.error;
    console.error('🚨 Video error:', error);
    
    if (onStreamError) {
      let errorMessage = 'Unknown video error';
      if (error) {
        switch (error.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            errorMessage = 'Video playback aborted';
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            errorMessage = 'Network error - stream may not be started';
            break;
          case MediaError.MEDIA_ERR_DECODE:
            errorMessage = 'Video decode error';
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = 'Stream not found or not started';
            break;
          default:
            errorMessage = `Video error: ${error.message}`;
        }
      }
      onStreamError(errorMessage);
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleLoadedMetadata = () => setDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleVolumeChange = () => setVolume(video.volume);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolumeChange);
    
    video.addEventListener('error', handleVideoError);

    // Auto-hide controls after 3 seconds
    let controlsTimeout: NodeJS.Timeout;
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(controlsTimeout);
      controlsTimeout = setTimeout(() => setShowControls(false), 3000);
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('error', handleVideoError);
      document.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(controlsTimeout);
    };
  }, []);

  useEffect(() => {
    if (streamingUrl) {
      setIsLive(true);
      if (videoRef.current) {
        videoRef.current.src = streamingUrl;
      }
    } else if (recordingUrl) {
      setIsLive(false);
      if (videoRef.current) {
        videoRef.current.src = recordingUrl;
      }
    }
  }, [streamingUrl, recordingUrl]);

  // Use the hook's togglePlayPause function
  const handleTogglePlayPause = () => {
    togglePlayPause();
  };

  // Use the hook's toggleMute function
  const handleToggleMute = () => {
    toggleMute();
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleStreamStart = () => {
    onStreamStart?.();
  };

  const handleStreamStop = () => {
    onStreamStop?.();
  };

  return (
    <div className={`${styles.videoContainer} ${className || ''}`}>
      <video
        ref={videoRef}
        className={styles.video}
        autoPlay={isLive}
        muted={isStreamer}
        playsInline
        controls={false}
        onContextMenu={(e) => e.preventDefault()}
      />
      
              {/* Canvas removed - not needed for basic video player */}

      {/* Live indicator */}
      {isLive && (
        <div className={styles.overlay}>
          <div className={styles.liveIndicator}>
            <span className={styles.liveDot}></span>
            <span className={styles.liveText}>LIVE</span>
          </div>
          {!isStreamer && viewerCount > 0 && (
            <div className={styles.viewerCount}>
              <span className={styles.viewerIcon}>👥</span>
              <span className={styles.viewerText}>{viewerCount}</span>
            </div>
          )}
        </div>
      )}

      {/* Video controls */}
      {showControls && (
        <div className={styles.controls}>
          {/* Play/Pause button */}
          <button
            onClick={handleTogglePlayPause}
            className={styles.controlButton}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {/* <Icon name={isPlaying ? 'PauseIcon' : 'PlayIcon'} size={20} /> */}
            {/* <Feather name={isPlaying ? 'pause' : 'play'} size={20} /> */}
          </button>

          {/* Progress bar */}
          <div className={styles.progressContainer}>
            <input
              type="range"
              min={0}
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className={styles.progressBar}
              disabled={isLive}
            />
            <div className={styles.timeDisplay}>
              {!isLive && (
                <>
                  <span>{formatTime(currentTime)}</span>
                  <span>/</span>
                  <span>{formatTime(duration)}</span>
                </>
              )}
            </div>
          </div>

          {/* Volume control */}
          <div className={styles.volumeContainer}>
            <button
              onClick={handleToggleMute}
              className={styles.controlButton}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {/* <Icon name={isMuted ? 'VolumeXIcon' : 'Volume2Icon'} size={20} /> */}
              {/* <Feather name={isMuted ? 'volume-x' : 'volume-2'} size={20} /> */}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={volume}
              onChange={handleVolumeChange}
              className={styles.volumeSlider}
            />
          </div>

          {/* Stream controls for streamers */}
          {isStreamer && (
            <div className={styles.streamControls}>
              {!isPlaying ? (
                <button
                  onClick={handleStreamStart}
                  className={`${styles.streamButton} ${styles.startButton}`}
                >
                  {/* <Icon name="PlayIcon" size={16} /> */}
                  {/* <Feather name="play" size={16} /> */}
                  Start Stream
                </button>
              ) : (
                <button
                  onClick={handleStreamStop}
                  className={`${styles.streamButton} ${styles.stopButton}`}
                >
                  <Icon name="ShareIcon" size={16} />
                  {/* <Feather name="square" size={16} /> */}
                  Stop Stream
                </button>
              )}
            </div>
          )}

          {/* Fullscreen button */}
          <button
            onClick={toggleFullscreen}
            className={styles.controlButton}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {/* <Icon name={isFullscreen ? 'MinimizeIcon' : 'MaximizeIcon'} size={20} /> */}
            {/* <Feather name={isFullscreen ? 'minimize-2' : 'maximize-2'} size={20} /> */}
          </button>
        </div>
      )}

      {/* Loading spinner */}
      {!isPlaying && !isLive && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading...</p>
        </div>
      )}
    </div>
  );
};
