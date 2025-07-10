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
  activeTabProps?: string;
}

export const NostrFeed: React.FC<NostrFeedProps> = ({
  kinds = [1], // Default to showing text posts and articles
  limit = 10,
  className = '',
  authors,
  searchQuery,
  since: sinceProps,
  until: untilProps,
  activeTabProps
}) => {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const { ndk, isNdkConnected } = useNostrContext();

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
  const [lastCreatedAt, setLastCreatedAt] = useState<number>(new Date().getTime());
  const [since, setSince] = useState<number>(sinceProps || Math.round(Date.now() / 1000) - 60 * 60 * 24 * 30);
  const [until, setUntil] = useState<number>(untilProps || Math.round(Date.now() / 1000));
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const [openFilters, setOpenFilters] = useState(false);

  const fetchEvents = async () => {
    // if (isLoadingMore || !hasMoreContent) return;
    console.log("isLoadingMore")
    if (isLoadingMore) return;

    try {
      setIsLoadingMore(true);
      console.log("fetching events");

      if (ndk.pool?.relays?.size === 0) {
        console.log("no relays");
        return;
      }

      if (ndk.pool?.connectedRelays().length === 0) {
        console.log("not connected");
        await ndk.connect();
        // return;
      } else {
        console.log("connected");
        console.log("connectedRelays", ndk.pool?.connectedRelays);
      }

      const notes = await ndk.fetchEvents({
        kinds: [...kinds],
        authors: authors,
        // searchQuery: searchQuery,
        // since: since,
        // until: until,
        // tags: tags,
        until: lastCreatedAt || Math.round(Date.now() / 1000),
        limit: limit ?? 10,
      });

      console.log("notes", notes);
      if (notes.size === 0) {
        setHasMoreContent(false);
        return;
      }

      // Filter out duplicate events based on their IDs
      let uniqueNotes = Array.from(
        new Set([...notes].map(note => note.id))
      ).map(id => [...notes].find(note => note.id === id)!);
      uniqueNotes = Array.from(new Set([...uniqueNotes].map(note => note)))
      // Sort notes by created_at timestamp in descending order (newest first)
      uniqueNotes.sort((a, b) => {
        return b.created_at - a.created_at;
      });

      if (uniqueNotes.length > 0) {
        setLastCreatedAt(uniqueNotes[uniqueNotes.length - 1].created_at);
        // setNotesData(uniqueNotes);
        setNotesData(prevNotes => [...prevNotes, ...uniqueNotes]);
      } else {
        setHasMoreContent(false);
      }
      return uniqueNotes;
    } catch (error) {
      console.error("Error fetching events:", error);
      setIsError(true);
      setError(error as Error);
    } finally {
      setIsLoadingMore(false);
      setIsInitialLoading(false);
    }
  }

  const loadInitialData = async () => {
    console.log("loading initial data");
    setNotesData([]);
    setIsLoadingMore(true)
    await fetchEvents();

    setIsInitialLoading(true);
    // setLastCreatedAt(0);
    setHasMoreContent(true);
    setIsError(false);
    setError(null);
    setIsInitialLoading(false);
  };

  // Initial data load
  useEffect(() => {
    if (isNdkConnected) {
      loadInitialData();
    }
  }, [isNdkConnected, kinds, limit, authors, searchQuery, since, until]);


  useEffect(() => {
    if (!isInitialLoading && !isLoadingMore) {
      // fetchEvents()
    };

  }, [kinds, limit, authors, searchQuery, since, until, isInitialLoading, isLoadingMore]);


  useEffect(() => {
    console.log("activeTabProps", activeTabProps);
    console.log("kinds", kinds);
    console.log("fetching events");
    setNotesData([]);
    setLastCreatedAt(Math.round(Date.now() / 1000));
    setHasMoreContent(true);
    setIsError(false);
    setError(null);
    setIsInitialLoading(true);
    loadInitialData();
    // fetchEvents();
  }, [activeTabProps]);

  // Intersection Observer for infinite scrolling
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    if (entry.isIntersecting) {
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

  // Show loading state
  if (isInitialLoading && notesData.length === 0) {
    return (
      <div className={`nostr-feed__content ${className}`}>
        <div className="flex justify-center items-center py-8">
          <CryptoLoading />
        </div>
      </div>
    );
  }

  // Show error state
  if (isError && notesData.length === 0) {
    return (
      <div className={`nostr-feed__content ${className}`}>
        <div className="nostr-feed__error">
          <p>Error loading eventstag: {error?.message || 'Unknown error'}</p>
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
    <div
      className={`nostr-feed__content ${className}`}
    // className={`${className}`}
    >



      {/* Filter Controls */}

      {openFilters && (
        <div className="nostr-feed__filters mb-4 p-3 rounded-lg">
          <div className="flex flex-wrap gap-2 justify-between items-center">
            <h3 className="text-sm font-medium">Feed Filters</h3>
            <button
              className="px-3 py-1 text-xs bg-blue-500 rounded hover:bg-blue-600 transition"
              onClick={() => fetchEvents()}
            >
              Refresh
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <div>
              <label className="block text-xs mb-1">Date Range</label>
              <div className="flex gap-2">
                <input
                  type="datetime-local"
                  value={until ? new Date(until * 1000).toISOString().slice(0, 16) : ''}
                  className="flex-1 px-2 py-1 text-xs rounded border dark:bg-gray-700 dark:border-gray-600"
                  onChange={(e) => {
                    const timestamp = Math.floor(new Date(e.target.value).getTime() / 1000);
                    if (!isNaN(timestamp)) {
                      // Set since timestamp
                    }
                  }}
                />
                <span className="self-center text-xs">to</span>
                <input
                  value={since ? new Date(since * 1000).toISOString().slice(0, 16) : ''}
                  type="datetime-local"
                  className="flex-1 px-2 py-1 text-xs rounded border dark:bg-gray-700 dark:border-gray-600"
                  onChange={(e) => {
                    const timestamp = Math.floor(new Date(e.target.value).getTime() / 1000);
                    if (!isNaN(timestamp)) {
                      setUntil(timestamp);
                    }
                  }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs mb-1">Search Tags</label>
              <input
                type="text"
                placeholder="Enter tags (comma separated)"
                className="w-full px-2 py-1 text-xs rounded border dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            <div>
              <label className="block text-xs mb-1">Author Pubkeys</label>
              <input
                type="text"
                placeholder="Enter pubkeys (comma separated)"
                className="w-full px-2 py-1 text-xs rounded border dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            <div>
              <label className="block text-xs mb-1">Event Kinds</label>
              <select
                className="w-full px-2 py-1 text-xs rounded border dark:bg-gray-700 dark:border-gray-600"
                multiple={false}
                value={kinds[0]}
                onChange={(e) => {
                  // Update kinds filter
                }}
              >
                <option value="1">Text Notes (1)</option>
                <option value="30023">Long-form Content (30023)</option>
                <option value="6">Reposts (6)</option>
                <option value="7">Reactions (7)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end mt-3">
            <button
              className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition"
              onClick={() => {
                setIsInitialLoading(true);
                // setNotesData([]);
                setLastCreatedAt(0);
                setHasMoreContent(true);
                fetchEvents().finally(() => setIsInitialLoading(false));
              }}
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
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
        <div className="nostr-feed__content">
          {notesData.map((event, index) => {
            if (!event?.id) return null;
            const isLastItem = index === notesData.length - 1;

            return (

              <div
                // className="nostr-feed__card"
                key={index}
                onClick={() => handleEventClick(event.id)}
                ref={isLastItem ? loaderRef : null}
              >
                <NostrEventCard
                  event={event}
                  isClickableHashtags={true}
                />
              </div>
            );
          })}

          {isLoadingMore && (
            <div className="flex justify-center items-center py-4">
              <CryptoLoading />
            </div>
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