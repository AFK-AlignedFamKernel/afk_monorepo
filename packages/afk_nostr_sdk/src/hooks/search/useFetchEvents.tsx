import { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk';
import { useInfiniteQuery, UseInfiniteQueryResult } from '@tanstack/react-query';

import { useNostrContext } from '../../context/NostrContext';
import { useState } from 'react';

export type UseSearch = {
  authors?: string[];
  search?: string;
  kind?: NDKKind;
  kinds?: NDKKind[];
  sortBy?: string;
  limit?: number;
  isWithouthReply?: boolean;
  since?: number;
  sinceInterval?: number;
  pageParamProps?: number;
  until?: number;
};

export const useFetchEvents = (options?: UseSearch) => {
  const { ndk } = useNostrContext();
  const [notesData, setNotesData] = useState<NDKEvent[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreContent, setHasMoreContent] = useState(true);
  const [lastCreatedAt, setLastCreatedAt] = useState<number|undefined>();
  const [until, setUntil] = useState<number>(options?.until || Math.round(Date.now() / 1000));
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isInitialFetching, setIsInitialFetching] = useState(true);

  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [openFilters, setOpenFilters] = useState(false);


  const fetchEvents = async () => {
    // if (isLoadingMore || !hasMoreContent) return;

    try {
      setIsLoadingMore(true);
      console.log("fetching events");
      const notes = await ndk.fetchEvents({
        kinds: [...options?.kinds ?? [options?.kind ?? NDKKind.Text]],
        authors: options?.authors,
        // until,
        until: lastCreatedAt || Math.round(Date.now() / 1000),
        limit: options?.limit ?? 10,
        // '#t': [selectedTag || ''],
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


      // Use Set to ensure unique notes by ID
      const uniqueNoteSet = new Set(uniqueNotes.map(note => note.id));
      const filteredNotes = uniqueNotes.filter(note => uniqueNoteSet.has(note.id));
      uniqueNotes = filteredNotes;
      // Sort notes by created_at timestamp in descending order (newest first)
      uniqueNotes.sort((a, b) => {
        return b.created_at - a.created_at;
      });

      if (uniqueNotes.length > 0) {
        setLastCreatedAt(uniqueNotes[uniqueNotes.length - 1].created_at);
        setNotesData(prevNotes => [...prevNotes, ...uniqueNotes]);
        // setNotesData(uniqueNotes);
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
      // setIsInitialLoading(false);
    }
  }


  const loadInitialData = async () => {
    console.log("loading initial data");
    setNotesData([]);
    await fetchEvents();

    setIsInitialLoading(true);
    setLastCreatedAt(0);
    setHasMoreContent(true);
    setIsError(false);
    setError(null);
    await fetchEvents();
    setIsInitialLoading(false);
    setIsInitialFetching(true)
  };

  // const queryInfinite = () => {
  //   return useInfiniteQuery({
  //     initialPageParam: 0,
  //     queryKey: ['search', options?.authors, options?.search, options?.kind, options?.kinds, options?.isWithouthReply, ndk],
  //     getNextPageParam: (lastPage: any, allPages, lastPageParam) => {
  //       if (!lastPage?.length) return undefined;
  //       const lastNote = lastPage[lastPage.length - 1];
  //       return lastNote.created_at - 1;
  //     },
  //     queryFn: async ({ pageParam }) => {
  //       // Simplify timestamp logic

  //       let basicTimestamp = (24 * 60 * 60);

  //       if (options?.sinceInterval) {
  //         basicTimestamp = options?.sinceInterval;
  //       }

  //       // if (!options?.kinds?.includes(NDKKind.Text)) {
  //       //   basicTimestamp = (24 * 60 * 60);
  //       // }
  //       const sinceTimestamp = pageParam > 0 ? pageParam : Math.round(Date.now() / 1000) - basicTimestamp; // Default to 24 hours ago
  //       // const sinceTimestamp = options?.since || pageParam || Math.round(Date.now() / 1000) - basicTimestamp; // Default to 24 hours ago
  //       // const sinceTimestamp = pageParam || Math.round(Date.now() / 1000) - basicTimestamp; // Default to 24 hours ago
  //       // const sinceTimestamp = pageParam || Math.round(Date.now() / 1000) - (24 * 60 * 60); // Default to 24 hours ago
  //       // const basicTimestamp = (24 * 60 * 60); // Default to 24 hours ago

  //       console.log("sinceTimestamp", sinceTimestamp);
  //       console.log("pageParam", pageParam);
  //       // const sinceTimestamp = pageParam
  //       //   ? pageParam - basicTimestamp :// Restart from pageParam minus 1 hour
  //       //   // ? pageParam - 1 * 60 * 60 :// Restart from pageParam minus 1 hour
  //       //   Math.round(Date.now() / 1000) - basicTimestamp; // Start from 1 hour ago

  //       try {
  //         const notes = await ndk.fetchEvents({
  //           kinds: options?.kinds ?? [options?.kind ?? NDKKind.Text],
  //           authors: options?.authors,
  //           search: options?.search,
  //           since: sinceTimestamp,
  //           until: options?.until || pageParam > 0 ? pageParam : Math.round(Date.now() / 1000),
  //           limit: options?.limit ?? 10,
  //         });

  //         // Filter out duplicate events based on their IDs
  //         const uniqueNotes = Array.from(
  //           new Set([...notes].map(note => note.id))
  //         ).map(id => [...notes].find(note => note.id === id)!);

  //         // If we're filtering out replies
  //         if (options?.isWithouthReply) {
  //           return uniqueNotes.filter(note => !note.tags.some(tag => tag[0] === 'e'));
  //         }

  //         // Sort notes by created_at timestamp in descending order (newest first)
  //         uniqueNotes.sort((a, b) => {
  //           return b.created_at - a.created_at;
  //         });
  //         // return [...notes];
  //         return [...uniqueNotes];
  //       } catch (error) {
  //         console.error('Error fetching events:', error);
  //         return [];
  //       }
  //     },
  //     placeholderData: { pages: [], pageParams: [] },
  //   });
  // }

  return {
      // queryInfinite,
    fetchEvents,
    loadInitialData,
    notesData,
    isLoadingMore,
    hasMoreContent,
    lastCreatedAt,
    until,
    isInitialLoading,
    isInitialFetching
  }
};

export default useFetchEvents;
