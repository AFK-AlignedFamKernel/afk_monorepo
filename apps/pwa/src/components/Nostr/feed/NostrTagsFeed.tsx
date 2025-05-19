'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { NDKEvent, NDKKind as NDK } from '@nostr-dev-kit/ndk';
import { useSearch, useProfile, useNostrContext } from 'afk_nostr_sdk';
import { NostrEventCard } from '../EventCard';
import { NostrEventKind } from '@/types/nostr';
import CryptoLoading from '@/components/small/crypto-loading';
import { TAGS_DEFAULT } from 'common';

interface NostrTagsFeedProps {
  kinds?: number[];
  limit?: number;
  className?: string;
  authors?: string[];
  searchQuery?: string;
  since?: number;
  until?: number;
  tagsProps?: string[];
  selectedTagProps?: string;
  selectedTagsProps?: string[];
  setSelectedTagProps?: (tag: string) => void;
}

export const NostrTagsFeed: React.FC<NostrTagsFeedProps> = ({
  kinds = [1], // Default to showing text posts and articles
  limit = 10,
  className = '',
  authors,
  searchQuery,
  since,
  until: untilProps,
  tagsProps,
  selectedTagProps,
  selectedTagsProps,
  setSelectedTagProps
}) => {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const { ndk } = useNostrContext();

  const [tags, setTags] = useState<string[]>(tagsProps || TAGS_DEFAULT);

  // console.log("tags", tags);

  const [notesData, setNotesData] = useState<NDKEvent[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreContent, setHasMoreContent] = useState(true);
  const [lastCreatedAt, setLastCreatedAt] = useState<number>(0);
  const [until, setUntil] = useState<number>(untilProps || Math.round(Date.now() / 1000));
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const [selectedTag, setSelectedTag] = useState<string | null>(selectedTagProps ?? tags[0]);
  const [openFilters, setOpenFilters] = useState(false);

  const fetchEvents = async () => {
    // if (isLoadingMore || !hasMoreContent) return;

    if(selectedTag === null || !selectedTag) return;
    try {
      setIsLoadingMore(true);
      console.log("fetching events");
      console.log("selectedTag", selectedTag);
      const notes = await ndk.fetchEvents({
        kinds: [...kinds],
        authors: authors,
        until: lastCreatedAt || Math.round(Date.now() / 1000),
        limit: limit ?? 10,
        '#t': [selectedTag],
      });

      console.log("notes", notes);
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
      setIsError(true);
      setError(error as Error);
    } finally {
      setIsLoadingMore(false);
      // setIsInitialLoading(false);
    }
  }

  const loadInitialData = async () => {
    console.log("loading initial data");
    setNotesData([]);


    await fetchEvents();
    // setLastCreatedAt(0);
    setHasMoreContent(true);
    setIsError(false);
    setError(null);
    setIsInitialLoading(false);
  };

  // Initial data load
  useEffect(() => {

    if (isInitialLoading) {
      loadInitialData();
    };

    // loadInitialData();
  }, [kinds, limit, authors, searchQuery, since, until, selectedTag, isInitialLoading]);


  const fetchEventsNostr = async () => {
    console.log("loading initial data");
    setNotesData([]);
    await fetchEvents();

    setIsInitialLoading(true);
    setLastCreatedAt(0);
    setHasMoreContent(true);
    setIsError(false);
    setError(null);
    await fetchEvents();
  };
  // useEffect(() => {
  //   console.log("selectedTag", selectedTag);
  //   if (!isInitialLoading) {
  //     setNotesData([]);
  //     fetchEvents();
  //   };

  // }, [kinds, limit, authors, searchQuery, since, until, selectedTag, isInitialLoading,]);

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

  // Show loading state
  if (isInitialLoading) {
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
        <div className="nostr-feed__tags-container flex gap-2 overflow-x-auto scrollbar-hide pb-2" >
          {tags.map((tag, index) => (
            <div
              className={`px-3 py-1.5 rounded-full cursor-pointer whitespace-nowrap transition-colors duration-200 shadow-md border border-indigo-600 ${
                selectedTag === tag 
                  ? 'bg-indigo-600 shadow-lg' 
                  : 'hover:bg-indigo-100 hover:shadow-lg'
              }`}
              key={index} 
              onClick={() => {
                setSelectedTag(tag);
                setLastCreatedAt(new Date().getTime() / 1000);
                setNotesData([]);
                fetchEvents();
              }}
            >
              <p className="text-sm font-medium">{tag}</p>
            </div>
          ))}
        </div>
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
        <div className="nostr-feed__content overflow-y-auto max-h-[80vh] ">

          {notesData.map((event, index) => {
            if (!event?.id) return null;
            const isLastItem = index === notesData.length - 1;

            return (
              <div
                // key={event.id}
                key={index}
              >
                <div
                  className="nostr-feed__card"
                  onClick={() => handleEventClick(event.id)}
                  ref={isLastItem ? loaderRef : null}
                >
                  <NostrEventCard
                    event={event}
                    isClickableHashtags={true}
                  />
                </div>
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

export default NostrTagsFeed; 