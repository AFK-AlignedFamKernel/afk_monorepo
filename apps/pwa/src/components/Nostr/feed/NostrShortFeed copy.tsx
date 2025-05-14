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

export const NostrShortFeed: React.FC<NostrFeedProps> = ({
  kinds = [1, 30023], // Default to showing text posts and articles
  limit = 10,
  className = '',
  authors,
  searchQuery,
  since,
  until
}) => {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const loaderRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLDivElement | null)[]>([]);
  const { ndk } = useNostrContext();

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
    if (e.deltaY > 0) {
      // Scroll down
      scrollToVideo(currentVideoIndex + 1);
    } else {
      // Scroll up
      scrollToVideo(currentVideoIndex - 1);
    }
  }, [currentVideoIndex, scrollToVideo]);

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
      style={{ height: '100vh', overflow: 'hidden' }}
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
            // Skip events without an id
            if (!event?.id) return null;

            return (
              <div
                key={event.id}
                ref={el => videoRefs.current[index] = el}
                className="nostr-short-feed__video-container"
                style={{ 
                  height: '100vh', 
                  width: '100%',
                  scrollSnapAlign: 'start',
                  position: 'relative'
                }}
                onClick={() => handleEventClick(event.id)}
              >
                <NostrEventCard
                  event={event}
                />
                <div className="nostr-short-feed__navigation">
                  {index > 0 && (
                    <button 
                      className="nostr-short-feed__nav-button nostr-short-feed__nav-up"
                      onClick={(e) => {
                        e.stopPropagation();
                        scrollToVideo(index - 1);
                      }}
                    >
                      ↑
                    </button>
                  )}
                  {index < events.length - 1 && (
                    <button 
                      className="nostr-short-feed__nav-button nostr-short-feed__nav-down"
                      onClick={(e) => {
                        e.stopPropagation();
                        scrollToVideo(index + 1);
                      }}
                    >
                      ↓
                    </button>
                  )}
                </div>
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