'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { NDKEvent, NDKKind as NDK } from '@nostr-dev-kit/ndk';
import { useSearch, useProfile, useNostrContext } from 'afk_nostr_sdk';
import { NostrEventCard } from '../EventCard';
import { NostrEventKind } from '@/types/nostr';
import CryptoLoading from '@/components/small/crypto-loading';
import { TAGS_DEFAULT } from 'common';
import { logClickedEvent } from '@/lib/analytics';
import styles from '@/styles/nostr/feed.module.scss';
import { Icon } from '@/components/small/icon-component';
import { ButtonSecondary } from '@/components/button/Buttons';

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
  sinceProps?: number;
  setSinceProps?: (since: number) => void;
  setUntilProps?: (until: number) => void;
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
  setSelectedTagProps,
  setSinceProps,
  setUntilProps
}) => {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const { ndk } = useNostrContext();

  const [tags, setTags] = useState<string[]>(tagsProps || TAGS_DEFAULT);

  // console.log("tags", tags);

  const [notesData, setNotesData] = useState<NDKEvent[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreContent, setHasMoreContent] = useState(true);
  const [lastCreatedAt, setLastCreatedAt] = useState<number>(Math.round(Date.now() / 1000));
  const [until, setUntil] = useState<number>(untilProps || Math.round(Date.now() / 1000));
  const [isError, setIsError] = useState(false);
  const [isUsedUntil, setIsUsedUntil] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(false);

  const [selectedTag, setSelectedTag] = useState<string | null>(selectedTagProps ?? tags[0]);
  const [openFilters, setOpenFilters] = useState(false);
  const [tagSearchInput, setTagSearchInput] = useState<string>('');
  const fetchEvents = async (tag?: string, _until?: number) => {
    // if (isLoadingMore || !hasMoreContent) return;

    console.log("lastCreatedAt", lastCreatedAt);
    if (selectedTag === null || !selectedTag) return;
    try {
      setIsLoadingMore(true);
      console.log("fetching events");
      console.log("selectedTag", selectedTag);
      console.log("isUsedUntil", isUsedUntil);
      console.log("lastCreatedAt", lastCreatedAt);
      console.log("until", _until);
      console.log("tag", tag);
      console.log("fetching events",);

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
        console.log("connectedRelays URLs:", ndk.pool?.connectedRelays().map(r => r.url));
      }

      const notes = await ndk.fetchEvents({
        kinds: [...kinds],
        authors: authors,
        // until: isUsedUntil ? lastCreatedAt : Math.round(Date.now() / 1000),
        since: Math.round(lastCreatedAt - 1000 * 60 * 60 * 24 * 3),
        until: _until ? Math.round(_until / 1000) : isUsedUntil ? lastCreatedAt : Math.round(Date.now() / 1000),
        limit: limit ?? 10,
        '#t': [tag || selectedTag],
      });

      console.log("notes", notes);
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
        setUntil(uniqueNotes[uniqueNotes.length - 1].created_at);
        setNotesData(prevNotes => [...prevNotes, ...uniqueNotes]);
      } else {
        setHasMoreContent(false);
      }
      setNotesData(prevNotes => [...prevNotes, ...uniqueNotes]);

      setIsUsedUntil(true);
      setIsInitialLoading(true);

    } catch (error) {
      console.error("Error fetching events:", error);
      setIsError(true);
      setError(error as Error);
    } finally {
      setIsLoadingMore(false);
    }
  }

  const loadInitialData = async () => {
    console.log("loading initial data");
    // setNotesData([]);


    await fetchEvents();
    // setLastCreatedAt(0);
    setHasMoreContent(true);
    setIsError(false);
    setError(null);
    // setIsInitialLoading(true);
    // setIsUsedUntil(true);
  };

  // Initial data load
  useEffect(() => {

    if (!isInitialLoading) {
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
  if (!isInitialLoading) {
    return (
      <div className={`${styles.nostrFeedContent} ${className}`}>
        <div className="flex justify-center items-center py-8">
          <CryptoLoading />
        </div>
      </div>
    );
  }

  // Show error state
  if (isError && notesData.length === 0) {
    return (
      <div className={`${styles.nostrFeedContent} ${className}`}>
        <div className={styles.nostrFeedError}>
          <p>Error loading events: {error?.message || 'Unknown error'}</p>
          <button
            className="mt-2 px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => {
              setIsInitialLoading(false);
              fetchEvents(selectedTag || "bitcoin", Math.round(Date.now() / 1000))
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles["nostr-feed"]} ${className}`}>

      <div className="flex flex-col w-full">
        <form
          className={styles["nostr-searchbar"]}
          onSubmit={e => {
            e.preventDefault();
            if (tagSearchInput.trim()) {
              if (!tags.includes(tagSearchInput.trim())) {
                setTags([tagSearchInput.trim(), ...tags]);
              }
              setSelectedTag(tagSearchInput.trim());
              setIsUsedUntil(false);
              setLastCreatedAt(new Date().getTime() / 1000);
              setNotesData([]);
              fetchEvents(tagSearchInput.trim(), Math.round(Date.now()));
              setTagSearchInput('');
            }
          }}
        >
          <input
            type="text"
            className={styles["nostr-searchbar__input"]}
            value={tagSearchInput || ''}
            onChange={e => setTagSearchInput(e.target.value)}
            placeholder="Search or add tag..."
          />
          <button
            type="submit"
            className={styles["nostr-searchbar__button"]}
            disabled={!tagSearchInput || tagSearchInput.trim().length === 0}
          >
            <Icon name="SearchIcon" size={18} />
          </button>
        </form>
        <div className={styles["nostr-tags-row"]}>
          {tags.map((tag, index) => (
            <div
              className={
                styles["nostr-tag"] + (selectedTag === tag ? ' ' + styles["selected"] : '')
              }
              key={index}
              tabIndex={0}
              onClick={() => {
                logClickedEvent(`select_tag_${tag}`, "click", tag)
                setIsUsedUntil(false);
                setSelectedTag(tag);
                setLastCreatedAt(new Date().getTime() / 1000);
                setNotesData([]);
                fetchEvents(tag, Math.round(Date.now()));
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  logClickedEvent(`select_tag_${tag}`, "click", tag)
                  setIsUsedUntil(false);
                  setSelectedTag(tag);
                  setLastCreatedAt(new Date().getTime() / 1000);
                  setNotesData([]);
                  fetchEvents(tag, Math.round(Date.now()));
                }
              }}
            >
              <span>{tag}</span>
            </div>
          ))}
        </div>
      </div>

      {notesData.length === 0 && !isLoadingMore ? (
        <div className={styles["nostr-feed__empty-state"]}>
          <p>No events found. Try following more users or changing filters.</p>
          <div className="mt-4 text-sm text-gray-500">
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
        <div
          // className="nostr-feed__content overflow-y-auto max-h-[80vh] "
          className={styles["nostr-feed__content"]}
        >

          {notesData.map((event, index) => {
            if (!event?.id) return null;
            const isLastItem = index === notesData.length - 1;

            return (

              <div
                key={index}
                // className="nostr-feed__card"
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
            <div className={styles["nostr-feed__end"]}>
              No more content to load
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NostrTagsFeed; 