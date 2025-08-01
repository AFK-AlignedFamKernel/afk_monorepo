'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { NDKKind as NDK } from '@nostr-dev-kit/ndk';
import { useSearch, useNostrContext, useFetchEvents } from 'afk_nostr_sdk';
import CryptoLoading from '@/components/small/crypto-loading';
import { VideoPlayer } from '../EventCard/NostrVideoPlayer';
import styles from '@/styles/nostr/shorts.module.scss';

interface NostrFeedProps {
  kinds?: number[];
  limit?: number;
  className?: string;
  authors?: string[];
  searchQuery?: string;
  since?: number;
  until?: number;
}

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
  const [fetchAttempts, setFetchAttempts] = useState(0);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollTimeRef = useRef<number>(0);
  const loaderRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLDivElement | null)[]>([]);
  const { ndk } = useNostrContext();

  // Touch handling for mobile
  const touchStartY = useRef<number>(0);
  const touchStartTime = useRef<number>(0);
  const isTouchScrolling = useRef<boolean>(false);

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
    // data: notesData,
    // isLoading,
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


  const {
    isLoadingMore: isLoading,
    notesData,
    fetchEvents,
    isInitialLoading,
    isInitialFetching,
    loadInitialData,
    hasMoreContent
  } = useFetchEvents({
    kinds: kinds.map(k => k as unknown as NDK),
    limit,
    authors,
  })

  // console.log("notesData", notesData);
  // Extract events from the paginated data
  // const events = notesDatad?.pages?.flat() || [];
  const events = notesData?.flat() || [];

  useEffect(() => {
    if (!isInitialFetching) {
      // console.log("loading initial data");
      loadInitialData()
    }
  }, [isInitialFetching])

  // Function to handle event selection
  const handleEventClick = (eventId: string) => {
    setSelectedEvent(eventId === selectedEvent ? null : eventId);
  };

  // Intersection Observer for infinite scrolling
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    if (entry.isIntersecting) {
      const now = Date.now();
      // Only attempt to fetch if enough time has passed since last fetch (2 seconds)
      if (now - lastFetchTime < 2000) return;

      if (hasMoreContent && !isLoading) {
        console.log("fetching more events");
        setLastFetchTime(now);
        fetchEvents();
      } else if (!hasMoreContent && fetchAttempts < 2) {
        console.log("reached end of list, attempting reinitialize");
        setLastFetchTime(now);
        setFetchAttempts(prev => prev + 1);
        // Only scroll to top when we're actually refetching at the end
        if (containerRef.current) {
          containerRef.current.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        }
        loadInitialData();
      }
    }
  }, [fetchEvents, hasMoreContent, isLoading, loadInitialData, lastFetchTime, fetchAttempts]);

  // Reset fetch attempts when new content is loaded
  useEffect(() => {
    if (notesData.length > 0) {
      setFetchAttempts(0);
    }
  }, [notesData]);

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
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [handleObserver]);

  // Handle smooth scrolling between videos
  const scrollToVideo = useCallback((index: number) => {
    console.log('scrollToVideo called with index:', index, 'events length:', events.length);

    if (index >= 0 && index < events.length && videoRefs.current[index]) {
      // Pause all videos
      document.querySelectorAll('video').forEach((video) => {
        if (video instanceof HTMLVideoElement) {
          video.pause();
          video.currentTime = 0;
        }
      });

      const targetElement = videoRefs.current[index];
      if (targetElement) {
        console.log('Scrolling to element:', targetElement);

        // Try scrollIntoView first
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });

        // Fallback: manually scroll the container
        setTimeout(() => {
          if (containerRef.current) {
            const container = containerRef.current;
            const targetRect = targetElement.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            const scrollTop = container.scrollTop + (targetRect.top - containerRect.top);

            container.scrollTo({
              top: scrollTop,
              behavior: 'smooth'
            });
          }
        }, 100);

        setCurrentVideoIndex(index);
      }
    } else {
      console.log('Invalid scroll target:', { index, eventsLength: events.length, hasRef: !!videoRefs.current[index] });
    }
  }, [events.length]);

  // Handle wheel event for scrolling between videos (desktop)
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

  // Handle touch events for mobile scrolling
  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
    isTouchScrolling.current = false;
    console.log('Touch start:', touchStartY.current);
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length > 1) return; // Ignore multi-touch

    const touchY = e.touches[0].clientY;
    const deltaY = touchStartY.current - touchY;
    const timeDelta = Date.now() - touchStartTime.current;

    console.log('Touch move:', { deltaY, timeDelta, currentIndex: currentVideoIndex });

    // Only handle significant vertical swipes
    if (Math.abs(deltaY) > 50 && timeDelta > 100) {
      isTouchScrolling.current = true;

      const now = Date.now();
      const timeSinceLastScroll = now - lastScrollTimeRef.current;

      if (timeSinceLastScroll < 500) return; // Debounce touch scrolling

      const direction = deltaY > 0 ? 1 : -1;
      const newIndex = currentVideoIndex + direction;

      console.log('Attempting to scroll to video:', newIndex, 'from:', currentVideoIndex);

      if (newIndex >= 0 && newIndex < events.length) {
        lastScrollTimeRef.current = now;
        scrollToVideo(newIndex);
      }
    }
  }, [currentVideoIndex, events.length, scrollToVideo]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    // Reset touch state
    isTouchScrolling.current = false;
    console.log('Touch end');
  }, []);

  // Set up wheel and touch event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      // Desktop wheel events
      container.addEventListener('wheel', handleWheel, { passive: false });

      // Mobile touch events
      container.addEventListener('touchstart', handleTouchStart, { passive: true });
      container.addEventListener('touchmove', handleTouchMove, { passive: false });
      container.addEventListener('touchend', handleTouchEnd, { passive: true });
    }
    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Initialize video refs array when events change
  useEffect(() => {
    videoRefs.current = videoRefs.current.slice(0, events.length);
  }, [events]);

  // Show loading state
  if (isLoading && events.length === 0) {
    return (
      <div className={`${styles['nostr-feed__content']} ${className}`}>
        <div className={styles['nostr-feed__loading-container']}>
          <CryptoLoading />
        </div>
      </div>
    );
  }

  // Show error state
  if (isError && events.length === 0) {
    return (
      <div className={`${styles['nostr-feed__content']} ${className}`}>
        <div className={styles['nostr-feed__error']}>
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
      className={`${styles['nostr-short-feed__container']} ${className}`}
      style={{ height: `${containerHeight}px`, overflow: 'hidden' }}
    >
      {/* Debug indicator */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'fixed',
          top: '10px',
          left: '10px',
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '5px 10px',
          borderRadius: '5px',
          fontSize: '12px',
          zIndex: 1000
        }}>
          Video {currentVideoIndex + 1} of {events.length}
        </div>
      )}

      {events.length === 0 && !isLoading && !isFetching ? (
        <div className={styles['nostr-feed__empty-state']}>
          <p>No videos found. Try following more users or changing filters.</p>
          <div className="mt-4 text-sm text-gray-500">
            <p>Debug info:</p>
            <p>- Connected to {relayCount} relays</p>
            <p>- Kinds: {kinds?.join(', ')}</p>
            <p>- Query status: {isLoading ? 'Loading' : (isError ? 'Error' : 'No Results')}</p>
            <button
              className="mt-2 px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={() => loadInitialData()}
            >
              Refresh Feed
            </button>
          </div>
        </div>
      ) : (
        <>
          {events.map((event, index) => {
            if (!event?.id) return null;
            const isLastItem = index === events.length - 1;

            return (
              <div
                key={index}
                ref={(el) => {
                  videoRefs.current[index] = el;
                  if (isLastItem) {
                    loaderRef.current = el;
                  }
                }}
                className={styles['nostr-short-feed__video-container']}
                style={{
                  height: `${containerHeight}px`,
                  width: '100%',
                  scrollSnapAlign: 'start',
                  position: 'relative'
                }}
              >
                <VideoPlayer event={event} isAutoPlay={index === currentVideoIndex} />
              </div>
            );
          })}

          {isLoading && (
            <div className={styles['nostr-feed__loading-more']}>
              <CryptoLoading />
            </div>
          )}

          {!hasMoreContent && events.length > 0 && (
            <div className={styles['nostr-feed__end'] + ' py-4 text-center text-gray-500'}>
              No more content to load
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default NostrShortFeed;