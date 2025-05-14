'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { NDKEvent, NDKKind as NDK } from '@nostr-dev-kit/ndk';
import { useSearch, useProfile, useNostrContext } from 'afk_nostr_sdk';
import { NostrEventCard } from '../EventCard';
import { NostrEventKind } from '@/types/nostr';
import './feed.scss';
import CryptoLoading from '@/components/small/crypto-loading';

interface NostrFeedProps {
  kinds?: number[];
  limit?: number;
  className?: string;
  authors?: string[];
  searchQuery?: string;
  since?: number;
  until?: number;
}

const VideoPlayer: React.FC<{ event: NDKEvent }> = ({ event }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const { data: profile } = useProfile({ publicKey: event.pubkey });
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const extractVideoUrl = () => {
      // Method 1: Try to parse JSON content
      try {
        const content = JSON.parse(event.content);
        if (content.media || content.url) {
          return content.media || content.url;
        }
      } catch (e) {
        // Not JSON, continue to other methods
      }

      // Method 2: Check media/video tags
      const mediaTags = event.tags.filter(tag => 
        tag[0] === 'media' || 
        tag[0] === 'video' || 
        tag[0] === 'image'
      );
      if (mediaTags.length > 0) {
        return mediaTags[0][1];
      }

      // Method 3: Check url/imeta tags
      const urlTag = event.tags.find(tag => tag[0] === 'url' || tag[0] === 'imeta');
      if (urlTag?.[1]) {
        const url = urlTag[1];
        if (url.includes('url:')) {
          return url.split('url:')[1].trim();
        }
        if (url.includes('etc:')) {
          return url.split('etc:')[1].trim();
        }
        // Check if the tag itself is a video URL
        const urlMatch = url.match(/(https?:\/\/[^\s]+\.(mp4|mov|avi|mkv|webm|gif))/i);
        if (urlMatch) {
          return urlMatch[0];
        }
        return url;
      }

      // Method 4: Check if content is a direct video URL
      if (event.content.match(/^https?:\/\/.*\.(mp4|mov|avi|webm|mkv|gif)/i)) {
        return event.content;
      }

      return null;
    };

    const url = extractVideoUrl();
    if (url) {
      const isVideo = url.match(/\.(mp4|mov|avi|webm|mkv|gif)$/i);
      if (isVideo) {
        setMediaUrl(url);
      } else {
        setError('URL is not a valid video format');
      }
    } else {
      setError('No video URL found');
    }
  }, [event]);

  // Handle video visibility and playback
  useEffect(() => {
    if (!videoRef.current || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
          if (entry.isIntersecting) {
            // Video is visible, play it
            videoRef.current?.play().then(() => {
              setIsPlaying(true);
            }).catch(() => {
              console.log('Autoplay prevented');
              setIsPlaying(false);
            });
          } else {
            // Video is not visible, pause it and reset
            if (videoRef.current) {
              videoRef.current.pause();
              videoRef.current.currentTime = 0;
              setIsPlaying(false);
            }
          }
        });
      },
      {
        threshold: 0.8,
        rootMargin: '-10% 0px'
      }
    );

    observer.observe(containerRef.current);

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  // Handle video state changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => {
      setIsPlaying(true);
      // Pause all other videos when this one starts playing
      document.querySelectorAll('video').forEach((v) => {
        if (v !== video) {
          v.pause();
          v.currentTime = 0;
          v.muted = true; // Ensure other videos are muted
        }
      });
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, []);

  const handleVideoClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      try {
        if (isPlaying) {
          await videoRef.current.pause();
          setIsPlaying(false);
        } else {
          await videoRef.current.play();
          setIsPlaying(true);
        }
      } catch (error) {
        console.error('Error toggling video playback:', error);
      }
    }
  };

  const handleAudioClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      setIsMuted(!isMuted);
      videoRef.current.muted = !isMuted;
    }
  };

  const handleVideoLoad = () => {
    setIsLoading(false);
    setError(null);
  };

  const handleVideoError = () => {
    setIsLoading(false);
    setError('Failed to load video');
  };

  if (!mediaUrl) {
    return <div className="nostr-short-feed__error">{error || 'No video URL found'}</div>;
  }

  const displayName = profile?.displayName || profile?.name || event.pubkey.substring(0, 8);
  const timestamp = new Date(event.created_at * 1000).toLocaleDateString();

  return (
    <div className="nostr-short-feed__video-wrapper" ref={containerRef}>
      {isLoading && (
        <div className="nostr-short-feed__loading">
          <CryptoLoading />
        </div>
      )}
      {error && (
        <div className="nostr-short-feed__error">
          {error}
        </div>
      )}
      <div className="nostr-short-feed__video-container" onClick={handleVideoClick}>
        <video
          ref={videoRef}
          src={mediaUrl}
          className="nostr-short-feed__video"
          controls
          playsInline
          loop
          muted={isMuted}
          preload="metadata"
          onLoadedData={handleVideoLoad}
          onError={handleVideoError}
        />
        {/* {!isPlaying && (
          <div className="nostr-short-feed__play-indicator">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )} */}
        <div className="nostr-short-feed__audio-indicator" onClick={handleAudioClick}>
          {/* {!isMuted && ( */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m2.828-9.9a9 9 0 012.728-2.728" />
            </svg>
          {/* )} */}
        </div>
      </div>
      
      {/* Right side interaction panel */}
      <div className="nostr-short-feed__interaction-panel">
        {/* Profile section */}
        <div className="nostr-short-feed__profile">
          <div className="nostr-short-feed__profile-avatar">
            {profile?.picture ? (
              <img
                src={profile.picture}
                alt={displayName}
                className="nostr-short-feed__avatar-image"
              />
            ) : (
              <div className="nostr-short-feed__avatar-placeholder">
                {displayName.substring(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <div className="nostr-short-feed__profile-info">
            <div className="nostr-short-feed__username">@{displayName}</div>
            <div className="nostr-short-feed__timestamp">{timestamp}</div>
          </div>
        </div>

        {/* Interaction buttons */}
        <div className="nostr-short-feed__actions">
          <button className="nostr-short-feed__action-button">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span>Like</span>
          </button>
          
          <button className="nostr-short-feed__action-button">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>Comment</span>
          </button>
          
          <button className="nostr-short-feed__action-button">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span>Share</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const NostrShortFeed: React.FC<NostrFeedProps> = ({
  kinds = [1, 30023],
  limit = 10,
  className = '',
  authors,
  searchQuery,
  since,
  until
}) => {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [containerHeight, setContainerHeight] = useState<number>(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollTimeRef = useRef<number>(0);
  const loaderRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLDivElement | null)[]>([]);
  const { ndk } = useNostrContext();

  // Set container height on client-side
  useEffect(() => {
    setContainerHeight(window.innerHeight);
    
    const handleResize = () => {
      setContainerHeight(window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const {
    data: notesData,
    isLoading,
    isFetching,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    refetch
  } = useSearch({
    kinds: kinds.map(k => k as unknown as NDK),
    limit,
    authors,
  });
  
  console.log("notesData", notesData);
  console.log("error", error);

  // Extract events from the paginated data
  const events = notesData?.pages?.flat() || [];

  // Function to handle event selection
  const handleEventClick = (eventId: string) => {
    setSelectedEvent(eventId === selectedEvent ? null : eventId);
  };

  // Intersection Observer for infinite scrolling
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    if (entry.isIntersecting && hasNextPage && !isFetching) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetching]);

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      rootMargin: '0px 0px 400px 0px',
      threshold: 0.1,
    });

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
      }
    };
  }, [handleObserver]);

  // Handle smooth scrolling between videos
  const scrollToVideo = useCallback((index: number) => {
    if (index >= 0 && index < events.length && videoRefs.current[index]) {
      // Pause all videos
      document.querySelectorAll('video').forEach((video) => {
        if (video instanceof HTMLVideoElement) {
          video.pause();
          video.currentTime = 0;
        }
      });

      videoRefs.current[index]?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
      
      setCurrentVideoIndex(index);
    }
  }, [events.length]);

  // Handle wheel event for scrolling between videos
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    
    const now = Date.now();
    const timeSinceLastScroll = now - lastScrollTimeRef.current;
    
    // Only process scroll if enough time has passed since last scroll
    if (timeSinceLastScroll < 300) return;

    const direction = e.deltaY > 0 ? 1 : -1;
    const newIndex = currentVideoIndex + direction;

    if (newIndex >= 0 && newIndex < events.length) {
      lastScrollTimeRef.current = now;
      scrollToVideo(newIndex);
    }
  }, [currentVideoIndex, events.length, scrollToVideo]);

  // Set up wheel event listener
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [handleWheel]);

  // Initialize video refs array when events change
  useEffect(() => {
    videoRefs.current = videoRefs.current.slice(0, events.length);
  }, [events]);

  // Show loading state
  if (isLoading && events.length === 0) {
    return (
      <div className={`nostr-feed__content ${className}`}>
        <div className="nostr-feed__loading-container">
          <CryptoLoading />
        </div>
      </div>
    );
  }

  // Show error state
  if (isError && events.length === 0) {
    return (
      <div className={`nostr-feed__content ${className}`}>
        <div className="nostr-feed__error">
          <p>Error loading events: {error?.message || 'Unknown error'}</p>
          <button
            className="mt-2 px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => refetch()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Get number of connected relays
  const relayCount = ndk.pool?.relays ? ndk.pool.relays.size : 0;

  return (
    <div 
      ref={containerRef}
      className={`nostr-short-feed__container ${className}`}
      style={{ height: `${containerHeight}px`, overflow: 'hidden' }}
    >
      {events.length === 0 && !isLoading && !isFetching ? (
        <div className="nostr-feed__empty-state">
          <p>No videos found. Try following more users or changing filters.</p>
          <div className="mt-4 text-sm text-gray-500">
            <p>Debug info:</p>
            <p>- Connected to {relayCount} relays</p>
            <p>- Kinds: {kinds?.join(', ')}</p>
            <p>- Query status: {isLoading ? 'Loading' : (isError ? 'Error' : 'No Results')}</p>
            <button
              className="mt-2 px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={() => refetch()}
            >
              Refresh Feed
            </button>
          </div>
        </div>
      ) : (
        <>
          {events.map((event, index) => {
            if (!event?.id) return null;

            return (
              <div
                key={event.id}
                ref={(el) => { videoRefs.current[index] = el; }}
                className="nostr-short-feed__video-container"
                style={{ 
                  height: `${containerHeight}px`, 
                  width: '100%',
                  scrollSnapAlign: 'start',
                  position: 'relative'
                }}
              >
                <VideoPlayer event={event} />
              </div>
            );
          })}

          <div ref={loaderRef} className="nostr-feed__loader">
            {isFetching && (
              <div className="nostr-feed__loading-more">
                <CryptoLoading />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NostrShortFeed;