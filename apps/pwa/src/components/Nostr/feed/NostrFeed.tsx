'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { NDKEvent, NDKKind as NDK } from '@nostr-dev-kit/ndk';
import { useSearch, useProfile, useNostrContext } from 'afk_nostr_sdk';
import { NostrEventCard } from '../EventCard';
import { NostrEventKind } from '@/types/nostr';
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

export const NostrFeed: React.FC<NostrFeedProps> = ({
  kinds = [1], // Default to showing text posts and articles
  limit = 10,
  className = '',
  authors,
  searchQuery,
  since,
  until:untilProps
}) => {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const { ndk } = useNostrContext();

  // Debug log the NDK instance and relays
  // useEffect(() => {
  //   console.log('NDK instance:', ndk);
  //   console.log('Connected relays count:', ndk.pool?.relays?.size || 0);
  //   const relayUrls = ndk.pool?.relays ? Array.from(ndk.pool.relays.keys()) : [];
  //   console.log('Relay URLs:', relayUrls);

  //   // Force connection to relays
  //   ndk.connect().then(() => {
  //     console.log('NDK connected!');
  //   }).catch(err => {
  //     console.error('NDK connection error:', err);
  //   });
  // }, [ndk]);

  const [notesData, setNotesData] = useState<NDKEvent[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreContent, setHasMoreContent] = useState(true);
  const [lastCreatedAt, setLastCreatedAt] = useState<number>(0);
  const [until, setUntil] = useState<number>(untilProps || Math.round(Date.now() / 1000));

  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchEvents = async () => {
    if (isLoadingMore || !hasMoreContent) return;

    try {
      setIsLoadingMore(true);
      console.log("fetching events");
      const notes = await ndk.fetchEvents({
        kinds: [...kinds],
        authors: authors,
        until: lastCreatedAt || Math.round(Date.now() / 1000),
        limit: limit ?? 10,
      });

      if (notes.size === 0) {
        setHasMoreContent(false);
        return;
      }

      // Filter out duplicate events based on their IDs
      const uniqueNotes = Array.from(
        new Set([...notes].map(note => note.id))
      ).map(id => [...notes].find(note => note.id === id)!);

      // Sort notes by created_at timestamp in descending order (newest first)
      uniqueNotes.sort((a, b) => {
        return b.created_at - a.created_at;
      });

      if (uniqueNotes.length > 0) {
        setLastCreatedAt(uniqueNotes[uniqueNotes.length - 1].created_at);
        setNotesData(prevNotes => [...prevNotes, ...uniqueNotes]);
      } else {
        setHasMoreContent(false);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }

  // Initial data load
  useEffect(() => {
    const loadInitialData = async () => {
      setNotesData([]);
      setLastCreatedAt(0);
      setHasMoreContent(true);
      await fetchEvents();
    };
    
    loadInitialData();
  }, [kinds, limit, authors, searchQuery, since, until]);

  // Intersection Observer for infinite scrolling
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    if (entry.isIntersecting && hasMoreContent && !isLoadingMore) {
      fetchEvents();
    }
  }, [hasMoreContent, isLoadingMore]);

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      rootMargin: '0px 0px 200px 0px',
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

  // Function to handle event selection
  const handleEventClick = (eventId: string) => {
    setSelectedEvent(eventId === selectedEvent ? null : eventId);
  };

  // // Show loading state
  // if (notesData.length === 0 && isLoadingMore) {
  //   return (
  //     <div className={`nostr-feed__content ${className}`}>
  //      <CryptoLoading />
  //     </div>
  //   );
  // }

  // Show error state
  if (isError && notesData.length === 0) {
    return (
      <div className={`nostr-feed__content ${className}`}>
        <div className="nostr-feed__error">
          <p>Error loading events: {error?.message || 'Unknown error'}</p>
          <button
            className="mt-2 px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => fetchEvents()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`nostr-feed__content ${className}`}>
      {notesData.length === 0 && !isLoadingMore ? (
        <div className="nostr-feed__empty-state">
          <p>No events found. Try following more users or changing filters.</p>
          <div className="mt-4 text-sm text-gray-500">
            <p>Debug info:</p>
            <p>- Connected to {ndk.pool?.relays?.size || 0} relays</p>
            <p>- Kinds: {kinds?.join(', ')}</p>
            <button
              className="mt-2 px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={() => fetchEvents()}
            >
              Refresh Feed
            </button>
          </div>
        </div>
      ) : (
        <div className="nostr-feed__content overflow-y-auto max-h-[80vh]">
          {notesData.map((event, index) => {
            if (!event?.id) return null;
            const isLastItem = index === notesData.length - 1;

            return (
              <div key={index}>
                <div
                  className="nostr-feed__card"
                  onClick={() => handleEventClick(event.id)}
                  ref={isLastItem ? loaderRef : null}
                >
                  <NostrEventCard
                    event={event}
                  />
                </div>
              </div>
            );
          })}

          {isLoadingMore && (
              <CryptoLoading />
          )}

          {!hasMoreContent && notesData.length > 0 && (
            <div className="nostr-feed__end py-4 text-center text-gray-500">
              No more content to load
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NostrFeed; 