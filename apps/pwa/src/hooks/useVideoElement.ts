import { useRef, useEffect, useCallback } from 'react';

interface UseVideoElementProps {
  stream?: MediaStream | null;
  screenStream?: MediaStream | null;
}

export const useVideoElement = ({ stream, screenStream }: UseVideoElementProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Update video source when streams change
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Priority: screen stream > camera stream
    const activeStream = screenStream || stream;
    
    if (activeStream) {
      video.srcObject = activeStream;
      
      // Auto-play when stream is available
      video.play().catch(error => {
        console.warn('Auto-play failed:', error);
      });
    } else {
      video.srcObject = null;
    }
  }, [stream, screenStream]);

  // Play video
  const play = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.play();
    }
  }, []);

  // Pause video
  const pause = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
  }, []);

  // Toggle play/pause
  const togglePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  }, []);

  // Set volume
  const setVolume = useCallback((volume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = Math.max(0, Math.min(1, volume));
    }
  }, []);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
    }
  }, []);

  // Get current time
  const getCurrentTime = useCallback(() => {
    return videoRef.current?.currentTime || 0;
  }, []);

  // Get duration
  const getDuration = useCallback(() => {
    return videoRef.current?.duration || 0;
  }, []);

  // Seek to time
  const seekTo = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  }, []);

  return {
    videoRef,
    play,
    pause,
    togglePlayPause,
    setVolume,
    toggleMute,
    getCurrentTime,
    getDuration,
    seekTo,
  };
};
