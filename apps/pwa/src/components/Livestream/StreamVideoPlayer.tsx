'use client';
import React, { useEffect, useState } from 'react';
import { Icon } from '../small/icon-component';
import { useVideoElement } from '@/hooks/useVideoElement';
import { useLivestreamWebSocket } from '@/contexts/LivestreamWebSocketContext';
import styles from './styles.module.scss';
import Hls from 'hls.js';

interface StreamVideoPlayerProps {
  streamingUrl?: string;
  recordingUrl?: string;
  isStreamer?: boolean;
  onStreamStart?: () => void;
  onStreamStop?: () => void;
  onStreamError?: (error: string) => void;
  className?: string;
  streamId?: string;
  streamStatus?: 'loading' | 'available' | 'not_started' | 'error';
  onRefreshStatus?: () => void;
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
  streamStatus,
  onRefreshStatus,
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
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Handle different stream statuses
  const renderStreamStatus = () => {
    // For external URLs, don't show status overlays as they should work immediately
    if (streamingUrl) {
      const urlType = detectUrlType(streamingUrl);
      if (urlType === 'external-hls' || urlType === 'external-other') {
        // External URLs should work immediately, no status overlay needed
        return null;
      }
    }

    if (streamStatus === 'loading') {
      return (
        <div className={styles.statusOverlay}>
          <div className={styles.statusContent}>
            <div className={styles.loadingSpinner}></div>
            <p>Checking stream status...</p>
          </div>
        </div>
      );
    }

    if (streamStatus === 'not_started') {
      return (
        <div className={styles.statusOverlay}>
          <div className={styles.statusContent}>
            <div className={styles.statusIcon}>📺</div>
            <h3>Stream Not Started</h3>
            <p>The host hasn't started broadcasting yet.</p>
            <p>Check back later or contact the host.</p>
            <button 
              className={styles.retryButton}
              onClick={onRefreshStatus || (() => window.location.reload())}
            >
              Refresh
            </button>
          </div>
        </div>
      );
    }

    if (streamStatus === 'available' && !isLive) {
      return (
        <div className={styles.statusOverlay}>
          <div className={styles.statusContent}>
            <div className={styles.statusIcon}>⏳</div>
            <h3>Stream Ready</h3>
            <p>The stream is ready but waiting for the host to go live.</p>
            <p>Video will appear automatically when broadcasting starts.</p>
            <button 
              className={styles.retryButton}
              onClick={onRefreshStatus || (() => window.location.reload())}
            >
              Check Status
            </button>
          </div>
        </div>
      );
    }

    if (streamStatus === 'error') {
      return (
        <div className={styles.statusOverlay}>
          <div className={styles.statusContent}>
            <div className={styles.statusIcon}>❌</div>
            <h3>Stream Error</h3>
            <p>Unable to connect to the stream.</p>
            <button 
              className={styles.retryButton}
              onClick={onRefreshStatus || (() => window.location.reload())}
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  // Debug: Log the props received
  useEffect(() => {
    console.log('🎥 StreamVideoPlayer received props:', {
      streamingUrl,
      recordingUrl,
      isStreamer,
      className,
      isStreaming,
      streamKey,
      streamId,
      streamStatus
    });
    
    // If we have a streaming URL, log what it points to
    if (streamingUrl) {
      console.log('🎯 Streaming URL details:', {
        url: streamingUrl,
        isLocalhost: streamingUrl.includes('localhost'),
        hasStreamId: streamingUrl.includes(streamId || ''),
        willAttemptToLoad: true
      });
    }
  }, [streamingUrl, recordingUrl, isStreamer, className, isStreaming, streamKey, streamId, streamStatus]);

  // Auto-join stream for viewers when streamId is available (ONLY for internal streams)
  useEffect(() => {
    if (streamId && !isStreamer && !isStreaming) {
      // Check if this is an external URL - if so, don't join WebSocket or push events
      if (streamingUrl) {
        const urlType = detectUrlType(streamingUrl);
        if (urlType === 'external-hls' || urlType === 'external-other') {
          console.log('🌐 External URL detected, skipping WebSocket join and event pushing');
          return;
        }
      }
      
      console.log('👥 Auto-joining internal stream as viewer:', streamId);
      console.log('🎯 Current streaming URL:', streamingUrl);
      
      // Join the WebSocket stream room (only for internal streams)
      joinStream(streamId, 'viewer');
      
      // If we have a streaming URL, set it as the video source
      if (streamingUrl && videoRef.current) {
        console.log('🎥 Setting internal HLS stream source for viewer:', streamingUrl);
        const video = videoRef.current;
        
        // Set proper HLS attributes
        video.setAttribute('data-stream-id', streamId);
        video.setAttribute('data-stream-type', 'hls');
        
        // Set the source
        video.src = streamingUrl;
        video.load();
        
        // Try to play
        video.play().catch(error => {
          console.warn('🎥 Auto-play failed for viewer:', error);
        });
      }
    }
  }, [streamId, isStreamer, isStreaming, joinStream, streamingUrl]);

  // Listen for stream events
  useEffect(() => {
    const handleStreamJoined = (event: CustomEvent) => {
      console.log('✅ Stream joined successfully:', event.detail);
      setViewerCount(event.detail.viewerCount || 0);
      setIsLive(event.detail.isLive || false);
      
      // If we're a viewer and have a streaming URL, ensure video is loaded
      if (!isStreamer && streamingUrl && videoRef.current) {
        console.log('🎥 Ensuring HLS stream is loaded after joining:', streamingUrl);
        const video = videoRef.current;
        video.src = streamingUrl;
        video.load();
        video.play().catch(error => {
          console.warn('🎥 Failed to play after joining stream:', error);
        });
      }
    };

    const handleStreamInitialized = (event: CustomEvent) => {
      console.log('🎬 Stream initialized with HLS data:', event.detail);
      setIsLive(true);
      setViewerCount(event.detail.viewerCount || 0);
      
      // If we have a manifest URL, update the video source
      if (event.detail.manifestUrl && videoRef.current) {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5050";
        const fullUrl = `${backendUrl}${event.detail.manifestUrl}`;
        console.log('🎥 Updating video source to HLS manifest:', fullUrl);
        videoRef.current.src = fullUrl;
        videoRef.current.load();
      }
    };

    const handleStreamSegmentsUpdated = (event: CustomEvent) => {
      console.log('📺 Stream segments updated:', event.detail);
      // This indicates new content is available
      setIsLive(true);
      
      // For HLS streams, we might need to reload the video to get new segments
      if (videoRef.current && event.detail.streamKey === streamId) {
        console.log('🔄 HLS segments updated, ensuring video is playing');
        if (videoRef.current.paused) {
          videoRef.current.play().catch(error => {
            console.warn('🎥 Failed to resume playback after segment update:', error);
          });
        }
      }
    };

    const handleStreamData = (event: CustomEvent) => {
      console.log('📺 Received stream data:', event.detail);
      // For viewers, this indicates the stream is active
      if (event.detail.streamKey === streamId) {
        setIsLive(true);
        console.log('✅ Stream is active and broadcasting data');
      }
    };

    const handleViewerJoined = (event: CustomEvent) => {
      console.log('👥 Viewer joined stream:', event.detail);
      if (event.detail.streamKey === streamId) {
        setViewerCount(event.detail.viewerCount || 0);
        console.log('👥 Viewer count updated:', event.detail.viewerCount);
      }
    };

    const handleViewerLeft = (event: CustomEvent) => {
      console.log('👥 Viewer left stream:', event.detail);
      if (event.detail.streamKey === streamId) {
        setViewerCount(event.detail.viewerCount || 0);
        console.log('👥 Viewer count updated:', event.detail.viewerCount);
      }
    };

    const handleStreamEnded = (event: CustomEvent) => {
      console.log('🛑 Stream ended event received:', event.detail);
      if (event.detail.streamKey === streamId) {
        console.log('🛑 Stream ended for this viewer');
        setIsLive(false);
        setLoadError('Stream has ended');
        setViewerCount(0);
        
        // Stop the video
        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.currentTime = 0;
        }
      }
    };

    window.addEventListener('stream-joined', handleStreamJoined as EventListener);
    window.addEventListener('stream-initialized', handleStreamInitialized as EventListener);
    window.addEventListener('stream-segments-updated', handleStreamSegmentsUpdated as EventListener);
    window.addEventListener('stream-data-received', handleStreamData as EventListener);
    window.addEventListener('viewer-joined', handleViewerJoined as EventListener);
    window.addEventListener('viewer-left', handleViewerLeft as EventListener);
    window.addEventListener('stream-ended', handleStreamEnded as EventListener);
    
    // Add missing event listeners for backend events
    const handleStreamReady = (event: CustomEvent) => {
      console.log('🎬 Stream ready event received:', event.detail);
      if (event.detail.streamKey === streamId) {
        setIsLive(true);
        console.log('✅ Stream is ready for viewing');
      }
    };
    
    const handleStreamError = (event: CustomEvent) => {
      console.error('❌ Stream error event received:', event.detail);
      if (event.detail.streamKey === streamId) {
        setLoadError(event.detail.error || 'Stream error occurred');
        setIsLive(false);
      }
    };
    
    window.addEventListener('stream-ready', handleStreamReady as EventListener);
    window.addEventListener('stream-error', handleStreamError as EventListener);

    return () => {
      window.removeEventListener('stream-joined', handleStreamJoined as EventListener);
      window.removeEventListener('stream-initialized', handleStreamInitialized as EventListener);
      window.removeEventListener('stream-segments-updated', handleStreamSegmentsUpdated as EventListener);
      window.removeEventListener('stream-data-received', handleStreamData as EventListener);
      window.removeEventListener('viewer-joined', handleViewerJoined as EventListener);
      window.removeEventListener('viewer-left', handleViewerLeft as EventListener);
      window.removeEventListener('stream-ended', handleStreamEnded as EventListener);
      window.removeEventListener('stream-ready', handleStreamReady as EventListener);
      window.removeEventListener('stream-error', handleStreamError as EventListener);
    };
  }, []);

  // Cleanup when component unmounts (ONLY for internal streams)
  useEffect(() => {
    return () => {
      if (streamId && !isStreamer) {
        // Check if this is an external URL - if so, don't leave stream
        if (streamingUrl) {
          const urlType = detectUrlType(streamingUrl);
          if (urlType === 'external-hls' || urlType === 'external-other') {
            console.log('🌐 External URL detected, skipping stream leave');
            return;
          }
        }
        
        console.log('👋 Leaving internal stream as viewer:', streamId);
        leaveStream();
      }
    };
  }, [streamId, isStreamer, leaveStream, streamingUrl]);


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

  // Enhanced stream monitoring for viewers (ONLY for internal streams)
  useEffect(() => {
    if (!streamId || isStreamer) return;

    // Check if this is an external URL - if so, skip monitoring
    if (streamingUrl) {
      const urlType = detectUrlType(streamingUrl);
      if (urlType === 'external-hls' || urlType === 'external-other') {
        console.log('🌐 External URL detected, skipping stream monitoring');
        return;
      }
    }

    console.log('👥 Viewer mode: Setting up stream monitoring for internal stream:', streamId);
    
    // Join the stream as a viewer (only for internal streams)
    joinStream(streamId, 'viewer-' + Date.now());
    
    // Set up periodic stream status checking (only if not already live)
    const statusCheckInterval = setInterval(async () => {
      // Only check if we're not already live to prevent unnecessary requests
      if (isLive) {
        console.log('🎬 Stream is already live, skipping status check');
        return;
      }
      
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5050';
        const response = await fetch(`${backendUrl}/livestream/${streamId}/status`);
        
        if (response.ok) {
          const status = await response.json();
          console.log('📊 Stream status check for viewer:', status);
          
          // Check if stream now has video content
          if (status.overall?.hasVideoContent) {
            console.log('🎬 Stream now has video content!');
            setIsLive(true);
            setLoadError(null);
            
            // If video is not playing, try to load it
            if (videoRef.current && !videoRef.current.src) {
              console.log('🎥 Loading video now that content is available');
              const videoUrl = `${backendUrl}/livestream/${streamId}/stream.m3u8`;
              videoRef.current.src = videoUrl;
              videoRef.current.load();
            }
          } else if (status.overall?.isActive && status.overall?.hasManifest) {
            console.log('⏳ Stream is active but waiting for video content');
            setIsLive(false);
            setLoadError('Stream is active - waiting for host to start broadcasting...');
          } else {
            console.log('❌ Stream is not active');
            setIsLive(false);
            setLoadError('Stream is not active or has ended');
          }
        }
      } catch (error) {
        console.error('❌ Error checking stream status:', error);
      }
    }, 5000); // Check every 5 seconds to reduce load

    return () => {
      clearInterval(statusCheckInterval);
      console.log('👋 Viewer leaving stream:', streamId);
      leaveStream();
    };
  }, [streamId, isStreamer]); // Remove joinStream, leaveStream, and isLive from dependencies to prevent infinite loops

  // Enhanced stream monitoring for broadcasters (to detect when stream becomes active)
  useEffect(() => {
    if (!streamId || !isStreamer) return;

    console.log('🎬 Broadcaster mode: Setting up stream monitoring for:', streamId);
    
    // Set up periodic stream status checking for broadcasters (only if not already live)
    const statusCheckInterval = setInterval(async () => {
      // Only check if we're not already live to prevent unnecessary requests
      if (isLive) {
        console.log('🎬 Broadcaster stream is already live, skipping status check');
        return;
      }
      
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5050';
        const response = await fetch(`${backendUrl}/livestream/${streamId}/status`);
        
        if (response.ok) {
          const status = await response.json();
          console.log('📊 Broadcaster stream status check:', status);
          
          // Check if stream now has video content (broadcaster is live)
          if (status.overall?.hasVideoContent) {
            console.log('🎬 Broadcaster stream is now LIVE with video content!');
            setIsLive(true);
            setLoadError(null);
            
            // Update the UI to show stream is active
            if (onStreamStart) {
              onStreamStart();
            }
          } else if (status.overall?.isActive && status.overall?.hasManifest) {
            console.log('⏳ Broadcaster stream is active but no video content yet');
            setIsLive(false);
            setLoadError('Stream is active - waiting for video data...');
          } else {
            console.log('❌ Broadcaster stream is not active');
            setIsLive(false);
            setLoadError('Stream is not active');
          }
        }
      } catch (error) {
        console.error('❌ Error checking broadcaster stream status:', error);
      }
    }, 5000); // Check every 5 seconds to reduce load

    return () => {
      clearInterval(statusCheckInterval);
    };
  }, [streamId, isStreamer]); // Remove onStreamStart and isLive from dependencies to prevent infinite loops

  // Helper function to detect URL type
  const detectUrlType = (url: string): 'internal-hls' | 'external-hls' | 'external-other' => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5050";
    
    // Check if it's our internal HLS stream
    if (url.includes(`${backendUrl}/livestream/`) && url.endsWith('.m3u8')) {
      return 'internal-hls';
    }
    
    // Check if it's an external HLS stream
    if (url.endsWith('.m3u8') || url.includes('m3u8')) {
      return 'external-hls';
    }
    
    // Check for other external streaming platforms
    if (url.includes('youtube.com') || url.includes('youtu.be') || 
        url.includes('twitch.tv') || url.includes('vimeo.com') ||
        url.includes('facebook.com') || url.includes('instagram.com') ||
        url.includes('tiktok.com') || url.includes('dailymotion.com')) {
      return 'external-other';
    }
    
    // Default to external-other for unknown URLs
    return 'external-other';
  };

  // Function to check if stream is actually available
  const checkStreamAvailability = async (url: string): Promise<boolean> => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok) {
        const manifest = await fetch(url).then(r => r.text());
        const segments = manifest.split('\n').filter(line => line.endsWith('.ts'));
        return segments.length > 0;
      }
      return false;
    } catch (error) {
      console.warn('⚠️ Stream availability check failed:', error);
      return false;
    }
  };

  // Simplified video loading - match HTML test approach
  useEffect(() => {
    if (streamingUrl) {
      console.log('🎥 Setting streaming URL:', streamingUrl);
      
      const urlType = detectUrlType(streamingUrl);
      console.log('🔍 Detected URL type:', urlType);
      
      // Clear any previous errors
      setLoadError(null);
      
      if (videoRef.current) {
        // Add event listeners for better debugging
        const video = videoRef.current;
        
        // Set attributes based on URL type
        if (urlType === 'internal-hls') {
          video.setAttribute('data-stream-type', 'hls');
          video.setAttribute('data-stream-id', streamId || 'unknown');
          video.setAttribute('crossorigin', 'anonymous');
        } else if (urlType === 'external-hls') {
          video.setAttribute('data-stream-type', 'external-hls');
          video.setAttribute('crossorigin', 'anonymous');
        } else {
          video.setAttribute('data-stream-type', 'external-other');
          // For external platforms, we might need different handling
        }
        
        // Check for HLS support and use HLS.js if needed
        const isHLS = urlType === 'internal-hls' || urlType === 'external-hls';
        if (isHLS) {
          console.log('🎥 Using HLS.js for HLS stream playback');
          
          if (Hls.isSupported()) {
            const hls = new Hls({
              debug: true, // Enable debug like the working HTML test
              enableWorker: true,
              lowLatencyMode: true,
              backBufferLength: 90
              // Remove invalid audioTrackSwitching property
            });
            
            hls.loadSource(streamingUrl);
            hls.attachMedia(video);
            
            hls.on(Hls.Events.MANIFEST_PARSED, function (event, data) {
              console.log('📋 HLS manifest parsed successfully');
              console.log(`📊 Found ${data.levels.length} quality levels`);
              
              // Check if audio tracks are available
              if (data.audioTracks && data.audioTracks.length > 0) {
                console.log(`🎵 Found ${data.audioTracks.length} audio tracks`);
              } else {
                console.warn('⚠️ No audio tracks found in HLS stream - this is normal for video-only streams');
                // Don't treat this as an error - video-only streams are valid
              }
              
              setIsLoading(false);
              setLoadError(null);
              setIsLive(true);
            });
            
            hls.on(Hls.Events.ERROR, function (event, data) {
              console.error('❌ HLS.js error:', data.type, data.details);
              
              if (data.fatal) {
                switch (data.type) {
                  case Hls.ErrorTypes.NETWORK_ERROR:
                    console.log('🔄 Fatal network error, trying to recover...');
                    hls.startLoad();
                    break;
                  case Hls.ErrorTypes.MEDIA_ERROR:
                    console.log('🔄 Fatal media error, trying to recover...');
                    hls.recoverMediaError();
                    break;
                  default:
                    console.error('❌ Fatal error, cannot recover');
                    hls.destroy();
                    break;
                }
              }
            });
            
            // Store HLS instance for cleanup
            (video as any).hls = hls;
          } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            console.log('🎥 Using native HLS support');
            video.src = streamingUrl;
            video.load();
          } else {
            console.error('❌ HLS is not supported in this browser');
            setLoadError('HLS is not supported in this browser. Please use a modern browser.');
            return;
          }
        } else {
          // Non-HLS streams
          video.src = streamingUrl;
          video.load();
        }
        
        const handleLoadStart = () => {
          console.log('🎥 Video load started');
          console.log('🎥 Video source:', video.src);
          console.log('🎥 Video currentSrc:', video.currentSrc);
          setIsLoading(true);
          setLoadError(null);
        };
        
        const handleLoadedMetadata = () => {
          console.log('🎥 Video metadata loaded');
          console.log('🎥 Video details:', {
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight,
            duration: video.duration,
            readyState: video.readyState,
            networkState: video.networkState,
            currentTime: video.currentTime,
            paused: video.paused,
            muted: video.muted,
            volume: video.volume
          });
        };
        
        const handleCanPlay = () => {
          console.log('🎥 Video can play');
          setIsLoading(false);
          setLoadError(null);
          setIsLive(true); // Set live when video can play
          
          // For external URLs, they're already broadcasting
          if (urlType === 'external-hls' || urlType === 'external-other') {
            console.log('🌐 External stream detected, setting live immediately');
          } else {
            console.log('🎬 Internal stream is now live');
          }
        };
        
        const handleCanPlayThrough = () => {
          console.log('🎯 Video can play through');
          setIsLoading(false);
          setLoadError(null);
        };
        
        const handleError = (e: Event) => {
          console.error('🎥 Video error:', e);
          setIsLoading(false);
          const target = e.target as HTMLVideoElement;
          if (target.error) {
            const errorDetails = {
              code: target.error.code,
              message: target.error.message
            };
            console.error('Video error details:', errorDetails);
            
            // Set user-friendly error message based on URL type
            let errorMessage = 'Failed to load stream';
            switch (target.error.code) {
              case MediaError.MEDIA_ERR_NETWORK:
                if (urlType === 'external-other') {
                  errorMessage = 'Network error - external stream may be unavailable';
                } else {
                  errorMessage = 'Network error - stream may not be started';
                }
                break;
              case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                if (urlType === 'external-other') {
                  errorMessage = 'External stream format not supported by browser';
                } else {
                  errorMessage = 'Stream not found or not started';
                }
                break;
              case MediaError.MEDIA_ERR_DECODE:
                if (target.error.message.includes('DEMUXER_ERROR_DETECTED_HLS')) {
                  if (urlType === 'external-hls') {
                    errorMessage = 'External HLS stream format error';
                  } else {
                    errorMessage = 'HLS manifest error - stream is waiting for broadcaster or segments are empty';
                  }
                } else {
                  errorMessage = 'Video decode error - stream format issue';
                }
                break;
              default:
                errorMessage = `Stream error: ${target.error.message}`;
            }
            setLoadError(errorMessage);
            
            // For HLS demuxer errors, try to reload after a delay
            if (target.error.message.includes('DEMUXER_ERROR_DETECTED_HLS') && urlType === 'internal-hls') {
              // Check if we've already retried to prevent infinite loops
              const retryKey = `hls_retry_${streamId}`;
              const retryCount = parseInt(sessionStorage.getItem(retryKey) || '0');
              const maxRetries = 3;
              
              if (retryCount < maxRetries) {
                console.log(`🔄 HLS demuxer error detected, will retry in 3 seconds... (${retryCount + 1}/${maxRetries})`);
                sessionStorage.setItem(retryKey, (retryCount + 1).toString());
                setLoadError(`Stream error - retrying in 3 seconds... (${retryCount + 1}/${maxRetries})`);
                
                setTimeout(() => {
                  if (videoRef.current && streamingUrl) {
                    console.log('🔄 Retrying HLS stream load...');
                    // Clear the error and try again
                    setLoadError(null);
                    videoRef.current.src = streamingUrl;
                    videoRef.current.load();
                  }
                }, 3000);
              } else {
                console.log('🔄 Max retries reached, not retrying again');
                setLoadError('Stream failed to load after multiple attempts. Please refresh the page or check if the stream is active.');
              }
            }
          }
        };
        
        const handleWaiting = () => {
          console.log('⏳ Video waiting for data');
        };
        
        const handleStalled = () => {
          console.log('⚠️ Video stalled');
        };
        
        const handleProgress = () => {
          if (video.buffered.length > 0) {
            const buffered = video.buffered.end(video.buffered.length - 1);
            const duration = video.duration;
            const percent = duration > 0 ? (buffered / duration * 100).toFixed(1) : 0;
            console.log(`📊 Buffered: ${percent}% (${buffered.toFixed(1)}s / ${duration.toFixed(1)}s)`);
          }
        };
        
        video.addEventListener('loadstart', handleLoadStart);
        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('canplay', handleCanPlay);
        video.addEventListener('canplaythrough', handleCanPlayThrough);
        video.addEventListener('error', handleError);
        video.addEventListener('waiting', handleWaiting);
        video.addEventListener('stalled', handleStalled);
        video.addEventListener('progress', handleProgress);
        
        // For HLS streams, the source is set by HLS.js
        if (!isHLS) {
          // Set the source for non-HLS streams
          video.src = streamingUrl;
          console.log('✅ Video source set to:', streamingUrl);
          video.load();
        }
        
        // Log the video element state
        console.log('🎥 Video element state after setup:', {
          src: video.src,
          readyState: video.readyState,
          networkState: video.networkState,
          error: video.error,
          currentSrc: video.currentSrc,
          urlType,
          isHLS
        });
        
        // Try to play after a short delay to allow HLS to initialize
        setTimeout(() => {
          video.play().catch(error => {
            console.warn('🎥 Auto-play failed:', error);
            if (error.name === 'NotAllowedError') {
              console.log('ℹ️ Autoplay blocked by browser, user interaction required');
            }
          });
        }, 1000);
        
        // Cleanup function
        return () => {
          video.removeEventListener('loadstart', handleLoadStart);
          video.removeEventListener('loadedmetadata', handleLoadedMetadata);
          video.removeEventListener('canplay', handleCanPlay);
          video.removeEventListener('canplaythrough', handleCanPlayThrough);
          video.removeEventListener('error', handleError);
          video.removeEventListener('waiting', handleWaiting);
          video.removeEventListener('stalled', handleStalled);
          video.removeEventListener('progress', handleProgress);
          
          // Cleanup HLS instance
          if ((video as any).hls) {
            (video as any).hls.destroy();
            (video as any).hls = null;
          }
        };
      }
    } else if (recordingUrl) {
      console.log('🎥 Setting recording URL:', recordingUrl);
      setIsLive(false);
      if (videoRef.current) {
        videoRef.current.src = recordingUrl;
      }
    }
  }, [streamingUrl, recordingUrl, streamId, streamStatus]);

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
            // Check for HLS-specific errors
            if (error.message.includes('DEMUXER_ERROR_DETECTED_HLS')) {
              errorMessage = 'HLS manifest error - stream is waiting for broadcaster';
            } else if (error.message.includes('DEMUXER_ERROR')) {
              errorMessage = 'Video decode error - stream format issue';
            } else {
              errorMessage = 'Video decode error';
            }
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
      
      {/* Stream status overlay */}
      {renderStreamStatus()}
      
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
      {isLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading stream...</p>
        </div>
      )}

      {/* Error display */}
      {loadError && (
        <div className={styles.errorOverlay}>
          <div className={styles.errorContent}>
            <p className={styles.errorMessage}>{loadError}</p>
            {loadError.includes('waiting for broadcaster') ? (
              <div className={styles.waitingMessage}>
                <p>⏳ The stream is ready but waiting for the broadcaster to go live...</p>
                <p>Please wait for the host to start streaming.</p>
                <button 
                  className={styles.retryButton}
                  onClick={() => {
                    setLoadError(null);
                    if (streamingUrl && videoRef.current) {
                      videoRef.current.src = streamingUrl;
                      videoRef.current.load();
                    }
                  }}
                >
                  Check Again
                </button>
              </div>
            ) : loadError.includes('Click to play external stream') ? (
              <button 
                className={styles.retryButton}
                onClick={() => {
                  setLoadError(null);
                  if (videoRef.current) {
                    videoRef.current.play().catch(error => {
                      console.warn('Manual play failed:', error);
                    });
                  }
                }}
              >
                Play Stream
              </button>
            ) : loadError.includes('retrying') ? (
              <div className={styles.waitingMessage}>
                <p>🔄 Attempting to reconnect to the stream...</p>
                <p>Please wait while we try to fix the connection.</p>
              </div>
            ) : (
              <div className={styles.waitingMessage}>
                <button 
                  className={styles.retryButton}
                  onClick={() => {
                    // Clear retry count and try again
                    if (streamId) {
                      sessionStorage.removeItem(`hls_retry_${streamId}`);
                    }
                    setLoadError(null);
                    if (streamingUrl && videoRef.current) {
                      videoRef.current.src = streamingUrl;
                      videoRef.current.load();
                    }
                  }}
                >
                  Retry Stream
                </button>
                <button 
                  className={styles.retryButton}
                  onClick={() => {
                    window.location.reload();
                  }}
                >
                  Refresh Page
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
