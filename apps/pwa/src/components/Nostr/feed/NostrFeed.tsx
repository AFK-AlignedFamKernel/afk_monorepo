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

export const NostrFeed: React.FC<NostrFeedProps> = ({
  kinds = [1, 30023], // Default to showing text posts and articles
  limit = 10,
  className = '',
  authors,
  searchQuery,
  since,
  until
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

  // Use the useNotesFilter hook from afk_nostr_sdk
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
    // Convert number[] to NDKKind[]
    kinds: kinds.map(k => k as unknown as NDK),
    limit,
    authors,
    // search: searchQuery
  });
  // console.log("notesData", notesData);
  // console.log("isLoading", isLoading);
  // console.log("isError", isError);
  // console.log("error", error);
  // console.log("hasNextPage", hasNextPage);
  // console.log("refetch", refetch);

  // Force refetch when parameters change
  useEffect(() => {
    refetch();
  }, [kinds, limit, authors, searchQuery, refetch]);

  // Log query parameters and results
  useEffect(() => {
    // console.log('Query parameters:', { kinds, limit, authors, searchQuery, since, until });
    // console.log('Notes data:', notesData);
    // console.log('isLoading:', isLoading);
    // console.log('isError:', isError);
    // console.log('error:', error);
  }, [notesData, isLoading, isError, error, kinds, limit, authors, searchQuery, since, until]);


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

  // // Fetch manually if hook isn't returning data
  // const [manualEvents, setManualEvents] = useState<NDKEvent[]>([]);

  // useEffect(() => {
  //   if (!isLoading && events.length === 0) {
  //     // Try to fetch manually if the hook isn't returning data
  //     const fetchEventsManually = async () => {
  //       try {
  //         console.log('Fetching events manually');
  //         await ndk.connect();

  //         const notes = await ndk.fetchEvents({
  //           kinds: kinds.map(k => k as unknown as NDK),
  //           limit: 20
  //         });

  //         console.log('Manually fetched notes:', notes);
  //         setManualEvents(Array.from(notes));
  //       } catch (e) {
  //         console.error('Manual fetch error:', e);
  //       }
  //     };

  //     fetchEventsManually();
  //   }
  // }, [ndk, events.length, isLoading, kinds]);

  // Show loading state
  if (isLoading && events.length === 0 && events.length === 0) {
    return (
      <div className={`nostr-feed__content ${className}`}>
        {[...Array(3)].map((_, index) => (
          <div key={`skeleton-${index}`} className="nostr-feed__card nostr-feed__card--skeleton">
            <NostrEventCard
              key={`skeleton-${index}`}
              event={{} as NDKEvent}
              isLoading={true}
            />
          </div>
        ))}
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

  // Combine events from hook and manual fetch
  const allEvents = events.length > 0 ? events : [];
  // const allEvents = events.length > 0 ? events : manualEvents;

  // Get number of connected relays
  const relayCount = ndk.pool?.relays ? ndk.pool.relays.size : 0;

  return (
    <div className={`nostr-feed__content ${className}`}>

      {allEvents.length === 0 && !isLoading && !isFetching ? (
        <div className="nostr-feed__empty-state">
          <p>No events found. Try following more users or changing filters.</p>
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
          {allEvents.map((event) => {
            // Skip events without an id
            if (!event?.id) return null;

            return (
              <div
                key={event.id}
                className="nostr-feed__card"
                onClick={() => handleEventClick(event.id)}
              >
                <NostrEventCard
                  event={event}
                />
              </div>
            );
          })}

          <div ref={loaderRef} className="nostr-feed__loader">
            {isFetching && (
              <div className="nostr-feed__loading-more">
                <p>Loading more events...</p>
                <CryptoLoading /> 
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NostrFeed; 