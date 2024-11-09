import {sign} from '@noble/secp256k1';
import {NDKEvent, NDKFilter} from '@nostr-dev-kit/ndk';
import {useInfiniteQuery, useMutation, useQuery} from '@tanstack/react-query';

import {useNostrContext} from '../../context';
import {useAuth} from '../../store';
import {generateRandomIdentifier, generateRandomKeypair, hashTag} from '../../utils/keypair';
import {
  LIVE_CHAT_KIND,
  LIVE_EVENT_KIND,
  LiveChatMessage,
  LiveEventData,
  LiveEventStatus,
  ParsedLiveChatMessage,
  Role,
  UseLiveEventsOptions,
} from './types';

// Helper function to generate participant proof
const generateParticipantProof = async (
  kind: number,
  pubkey: string,
  identifier: string,
): Promise<string> => {
  const {privateKey} = generateRandomKeypair();
  const tag = `${kind}:${pubkey}:${identifier}`;
  const hash = await hashTag(tag);
  const signature = sign(hash, privateKey).toCompactHex();
  return Buffer.from(signature).toString('hex');
};

// Main hook for all live event operations
export const useLiveActivity = (eventId?: string) => {
  const {ndk} = useNostrContext();
  const {publicKey: currentUserPubkey} = useAuth();

  // Create new live event
  const createEvent = useMutation({
    mutationKey: ['createLiveEvent', ndk],
    mutationFn: async (data: LiveEventData) => {
      const event = new NDKEvent(ndk);
      event.kind = LIVE_EVENT_KIND;
      const identifier = await generateRandomIdentifier();

      const tags: string[][] = [['d', identifier]];

      if (data.title) tags.push(['title', data.title]);
      if (data.summary) tags.push(['summary', data.summary]);
      if (data.imageUrl) tags.push(['image', data.imageUrl]);
      if (data.streamingUrl) tags.push(['streaming', data.streamingUrl]);
      if (data.recordingUrl) tags.push(['recording', data.recordingUrl]);
      if (data?.startsAt) tags.push(['starts', data.startsAt.toString()]);
      if (data?.endsAt) tags.push(['ends', data.endsAt.toString()]);
      tags.push(['status', data.status]);

      if (data.currentParticipants) {
        tags.push(['current_participants', data.currentParticipants.toString()]);
      }
      if (data.totalParticipants) {
        tags.push(['total_participants', data.totalParticipants.toString()]);
      }

      data.participants.forEach((participant) => {
        tags.push([
          'p',
          participant.pubkey,
          participant.relay || '',
          participant.role,
          participant.proof || '',
        ]);
      });

      if (data.relays?.length) {
        tags.push(['relays', ...data.relays]);
      }

      data.hashtags?.forEach((tag) => {
        tags.push(['t', tag]);
      });

      event.tags = tags;
      event.content = '';

      return event.publish();
    },
  });

  // Update existing event
  const updateEvent = useMutation({
    mutationKey: ['updateLiveEvent', eventId],
    mutationFn: async (updates: Partial<LiveEventData>) => {
      if (!eventId) throw new Error('Event ID is required for updates');

      const filter: NDKFilter = {
        kinds: [LIVE_EVENT_KIND as any],
        '#d': [eventId],
      };

      const events = await ndk.fetchEvents(filter);
      const currentEvent = Array.from(events)[0];

      if (!currentEvent) throw new Error('Event not found');

      const event = new NDKEvent(ndk);
      event.kind = LIVE_EVENT_KIND;

      const currentTags = new Map(
        currentEvent.tags.map((t) => [t[0] + (t[0] === 't' ? t[1] : ''), t]),
      );

      if (updates.title) currentTags.set('title', ['title', updates.title]);
      if (updates.summary) currentTags.set('summary', ['summary', updates.summary]);
      if (updates.imageUrl) currentTags.set('image', ['image', updates.imageUrl]);
      if (updates.streamingUrl) currentTags.set('streaming', ['streaming', updates.streamingUrl]);
      if (updates.recordingUrl) currentTags.set('recording', ['recording', updates.recordingUrl]);
      if (updates.startsAt) currentTags.set('starts', ['starts', updates.startsAt.toString()]);
      if (updates.endsAt) currentTags.set('ends', ['ends', updates.endsAt.toString()]);
      if (updates.status) currentTags.set('status', ['status', updates.status]);

      if (updates.hashtags) {
        Array.from(currentTags.keys())
          .filter((key) => key.startsWith('t'))
          .forEach((key) => currentTags.delete(key));

        updates.hashtags.forEach((tag) => {
          currentTags.set('t' + tag, ['t', tag]);
        });
      }

      if (updates.relays) {
        currentTags.set('relays', ['relays', ...updates.relays]);
      }

      event.tags = Array.from(currentTags.values());
      event.content = '';

      return event.publish();
    },
  });

  // Delete event
  const deleteEvent = useMutation({
    mutationKey: ['deleteLiveEvent', eventId],
    mutationFn: async () => {
      if (!eventId) throw new Error('Event ID is required for deletion');

      const event = new NDKEvent(ndk);
      event.kind = LIVE_EVENT_KIND;
      event.tags = [
        ['e', eventId],
        ['a', `${LIVE_EVENT_KIND}:${eventId}`],
      ];
      event.content = 'DELETED';

      return event.publish();
    },
  });

  // Fetch a single event
  const {data: event} = useQuery({
    queryKey: ['liveEvent', eventId],
    enabled: !!eventId && !!ndk,
    queryFn: async () => {
      const filter: NDKFilter = {
        kinds: [LIVE_EVENT_KIND as any],
        '#d': [eventId],
      };

      const events = await ndk.fetchEvents(filter);
      const foundEvent = Array.from(events)[0];
      return foundEvent ? parseLiveEventData(foundEvent) : null;
    },
  });

  // Manage participants
  const addParticipant = useMutation({
    mutationKey: ['addParticipant', eventId],
    mutationFn: async ({pubkey, role, relay}: {pubkey: string; role: Role; relay?: string}) => {
      if (!eventId) throw new Error('Event ID is required');

      const proof = await generateParticipantProof(LIVE_EVENT_KIND, pubkey, eventId);
      return updateEvent.mutateAsync({
        participants: [...(event?.participants || []), {pubkey, role, relay, proof}],
      });
    },
  });

  const removeParticipant = useMutation({
    mutationKey: ['removeParticipant', eventId],
    mutationFn: async (pubkeyToRemove: string) => {
      if (!eventId) throw new Error('Event ID is required');

      return updateEvent.mutateAsync({
        participants: event?.participants.filter((p) => p.pubkey !== pubkeyToRemove) || [],
      });
    },
  });

  // Chat functionality
  const useSendLiveChatMessage = useMutation({
    mutationKey: ['sendLiveChatMessage', eventId],
    mutationFn: async (
      data: LiveChatMessage & {
        replyTo?: {
          id: string;
          marker: 'reply' | 'mention';
        };
      },
    ) => {
      const event = new NDKEvent(ndk);
      event.kind = LIVE_CHAT_KIND;
      event.content = data.content;

      // Base tags - always include the activity tag with root marker
      const tags: string[][] = [
        ['a', `${LIVE_EVENT_KIND}:${currentUserPubkey}:${data.eventId}`, '', 'root'],
        ['p', data.pubkey],
      ];

      // Add reply or mention if present
      if (data.replyTo) {
        tags.push(['e', data.replyTo.id, '', data.replyTo.marker]);
      }

      event.tags = tags;

      return event.publish();
    },
  });

  // Chat messages query
  const useGetLiveChat = (options?: UseLiveEventsOptions & {eventId: string}) => {
    const {ndk} = useNostrContext();
    const {publicKey: currentUserPubkey} = useAuth();

    return useInfiniteQuery({
      initialPageParam: 0,
      queryKey: ['liveChatMessages', options?.eventId],
      getNextPageParam: (lastPage: ParsedLiveChatMessage[], allPages, lastPageParam) => {
        if (!lastPage?.length) return undefined;

        const pageParam = lastPage[lastPage.length - 1].created_at - 1;

        if (!pageParam || pageParam === lastPageParam) return undefined;
        return pageParam;
      },
      queryFn: async ({pageParam}) => {
        const filter: NDKFilter = {
          kinds: [LIVE_CHAT_KIND as any],
          '#a': [`${LIVE_EVENT_KIND}:${currentUserPubkey}:${options.eventId}`],
          until: pageParam || Math.round(Date.now() / 1000),
          limit: options?.limit || 20,
        };

        const events = await ndk.fetchEvents(filter);

        console.log([...events], 'evt');
        // Parse each event to extract reply structure and root information
        return [...events].map((event) => {
          const parsed: ParsedLiveChatMessage = {
            id: event.id,
            pubkey: event.pubkey,
            content: event.content,
            created_at: event.created_at,
            activityTag: {
              type: '',
              pubkey: '',
              identifier: '',
            },
          };

          // Parse all tags
          event.tags.forEach((tag) => {
            // Handle activity tag (always present)
            if (tag[0] === 'a' && tag[3] === 'root') {
              const [type, pubkey, identifier] = tag[1].split(':');
              parsed.activityTag = {
                type,
                pubkey,
                identifier,
                relay: tag[2] || undefined,
              };
            }

            // Handle reply tag
            if (tag[0] === 'e' && tag[2] === '' && tag[3] === 'reply') {
              parsed.replyTo = {
                id: tag[1],
                marker: tag[3],
              };
            }
          });

          return parsed;
        });
      },
      placeholderData: {pages: [], pageParams: []},
    });
  };

  return {
    // Event CRUD operations
    createEvent,
    updateEvent,
    deleteEvent,
    event,

    // Participant management
    addParticipant,
    removeParticipant,

    // Chat functionality
    useSendLiveChatMessage,
    useGetLiveChat,
  };
};

// Fetch multiple events with pagination
export const useGetLiveEvents = (options?: UseLiveEventsOptions) => {
  const {ndk} = useNostrContext();
  return useInfiniteQuery({
    initialPageParam: 0,
    queryKey: ['liveEvents', options?.authors, options?.status, options?.search, options?.hashtag],
    getNextPageParam: (lastPage: any, allPages, lastPageParam) => {
      if (!lastPage?.length) return undefined;

      const pageParam = lastPage[lastPage.length - 1].created_at - 1;

      if (!pageParam || pageParam === lastPageParam) return undefined;
      return pageParam;
    },
    queryFn: async ({pageParam}) => {
      const baseFilter: NDKFilter = {
        kinds: [LIVE_EVENT_KIND as any],
        until: pageParam || Math.round(Date.now() / 1000),
        limit: options?.limit || 20,
      };

      if (options?.status) baseFilter['#status'] = [options.status];
      if (options?.authors?.length) baseFilter.authors = options.authors;
      if (options?.search) baseFilter.search = options.search;
      if (options?.hashtag) baseFilter['#t'] = [options.hashtag];

      const events = await ndk.fetchEvents(baseFilter);

      const eventsArray = Array.from(events);
      return eventsArray.map((event) => parseLiveEventData(event)).filter(Boolean);
    },
    placeholderData: {pages: [], pageParams: []},
  });
};

// Helper function to parse event data
const parseLiveEventData = (event: NDKEvent): LiveEventData | null => {
  if (!event) return null;

  const identifier = event.tags.find((t) => t[0] === 'd')?.[1] || '';
  const status = (event.tags.find((t) => t[0] === 'status')?.[1] || 'planned') as LiveEventStatus;
  const participants = event.tags
    .filter((t) => t[0] === 'p')
    .map((t) => ({
      pubkey: t[1],
      relay: t[2],
      role: t[3],
      proof: t[4],
    }));

  return {
    identifier,
    eventId: event.id,
    title: event.tags.find((t) => t[0] === 'title')?.[1],
    summary: event.tags.find((t) => t[0] === 'summary')?.[1],
    imageUrl: event.tags.find((t) => t[0] === 'image')?.[1],
    streamingUrl: event.tags.find((t) => t[0] === 'streaming')?.[1],
    recordingUrl: event.tags.find((t) => t[0] === 'recording')?.[1],
    startsAt: Number(event.tags.find((t) => t[0] === 'starts')?.[1]),
    endsAt: Number(event.tags.find((t) => t[0] === 'ends')?.[1]),
    status,
    currentParticipants: Number(event.tags.find((t) => t[0] === 'current_participants')?.[1]),
    totalParticipants: Number(event.tags.find((t) => t[0] === 'total_participants')?.[1]),
    participants: participants as any,
    hashtags: event.tags.filter((t) => t[0] === 't').map((t) => t[1]),
    relays: event.tags.find((t) => t[0] === 'relays')?.slice(1),
  };
};
