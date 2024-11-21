import {signAsync} from '@noble/secp256k1';
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
const generateParticipantProof = async (kind: number, pubkey: string, identifier: string) => {
  const {privateKey} = generateRandomKeypair();
  const tag = `${kind}:${pubkey}:${identifier}`;
  const hash = await hashTag(tag);
  const signature = await signAsync(hash, privateKey);
  return signature.toCompactHex();
};

const useDeleteEvent = () => {
  const {ndk} = useNostrContext();
  return useMutation({
    mutationKey: ['deleteLiveEvent'],
    mutationFn: async (updates: Partial<LiveEventData>) => {
      const event = new NDKEvent(ndk);
      event.kind = LIVE_EVENT_KIND;

      event.tags = [
        updates.tags,
        ['d', updates.eventId],
        ['a', `${LIVE_EVENT_KIND}:${updates.eventId}`],
      ];
      event.content = 'DELETED';

      return event.publish();
    },
  });
};

// Main hook for all live event operations
export const useLiveActivity = (eventId?: string) => {
  const updateEvent = useEditEvent();
  const deleteEvent = useDeleteEvent();
  const {data: event} = useGetSingleEvent({eventId});
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
      const proof = await generateParticipantProof(LIVE_EVENT_KIND, currentUserPubkey, identifier);

      data.participants.forEach((participant) => {
        tags.push([
          'p',
          participant.pubkey,
          participant.relay || '',
          participant.role,
          proof || '',
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

  // Manage participants
  const addParticipant = useMutation({
    mutationKey: ['addParticipant', eventId],
    mutationFn: async ({
      pubkey,
      role,
      relay = '',
      identifier,
    }: {
      pubkey: string;
      role: Role;
      relay?: string;
      identifier?: string;
    }) => {
      return updateEvent.mutate({
        eventId: identifier,
        shouldMarkDelete: true,
        participants: [...(event?.participants || []), {pubkey, role, relay}],
      });
    },
  });

  const removeParticipant = useMutation({
    mutationKey: ['removeParticipant', eventId],
    mutationFn: async (pubkeyToRemove: string) => {
      if (!eventId) throw new Error('Event ID is required');

      return updateEvent.mutate({
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
        ['a', `${LIVE_EVENT_KIND}:${data.eventId}`, '', 'root'],
        // ['a', `${LIVE_EVENT_KIND}:${currentUserPubkey}:${data.eventId}`, '', 'root'],
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
          '#a': [`${LIVE_EVENT_KIND}:${options.eventId}`],
          // '#a': [`${LIVE_EVENT_KIND}:${currentUserPubkey}:${options.eventId}`],
          until: pageParam || Math.round(Date.now() / 1000),
          limit: options?.limit || 20,
        };

        const events = await ndk.fetchEvents(filter);

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

      console.log(eventsArray, 'ev');
      const data = eventsArray
        .map((event) => parseLiveEventData(event))
        .filter((event) => event && event.content !== 'DELETED');

      return data;
    },
    placeholderData: {pages: [], pageParams: []},
  });
};

// Fetch a single event

export const useGetSingleEvent = (options?: {eventId: string}) => {
  const {ndk} = useNostrContext();
  return useQuery({
    queryKey: ['SingleliveEvent', options.eventId],
    enabled: !!options.eventId,
    queryFn: async () => {
      const filter: NDKFilter = {
        kinds: [LIVE_EVENT_KIND as any],
        '#d': [options.eventId],
      };
      const event = await ndk.fetchEvent(filter);
      return event ? parseLiveEventData(event) : null;
    },
  });
};

// Update existing event
export const useEditEvent = () => {
  const {ndk} = useNostrContext();
  const {mutate: deleteEvent} = useDeleteEvent();
  return useMutation({
    mutationKey: ['EditEvent'],
    mutationFn: async ({shouldMarkDelete = true, ...updates}: Partial<LiveEventData>) => {
      const filter: NDKFilter = {
        kinds: [LIVE_EVENT_KIND as any],
        '#d': [updates.eventId],
      };

      const currentEvent = await ndk.fetchEvent(filter);

      // //Check to delete
      if (shouldMarkDelete) {
        return deleteEvent({
          eventId: updates.eventId,
          tags: currentEvent.tags,
        });
      }

      const currentTags = new Map(
        currentEvent.tags.map((t) => [t[0] + (t[0] === 't' ? t[1] : ''), t]),
      );
      const status = currentTags.get('status')[1];

      if (updates.title) currentTags.set('title', ['title', updates.title]);
      if (updates.summary) currentTags.set('summary', ['summary', updates.summary]);
      if (updates.imageUrl) currentTags.set('image', ['image', updates.imageUrl]);
      if (updates.streamingUrl) currentTags.set('streaming', ['streaming', updates.streamingUrl]);
      if (updates.recordingUrl) currentTags.set('recording', ['recording', updates.recordingUrl]);
      if (updates.startsAt) currentTags.set('starts', ['starts', updates.startsAt.toString()]);
      if (updates.endsAt) currentTags.set('ends', ['ends', updates.endsAt.toString()]);
      if (updates.status)
        currentTags.set('status', ['status', status !== 'ended' && updates.status]);

      if (updates.participants) {
        const existingParticipants = new Set(
          Array.from(currentTags)
            .filter(([, tag]) => tag[0] === 'p')
            .map(([key]) => key), // Collect constructed keys
        );

        const uniqueParticipants = new Map();
        updates.participants.forEach((participant) => {
          const key = 'p' + participant.pubkey;
          if (!uniqueParticipants.has(key)) {
            uniqueParticipants.set(key, participant);
          }
        });

        const newUniqueParticipants = Array.from(uniqueParticipants.values()).filter(
          (participant) => !existingParticipants.has('p' + participant.pubkey),
        );

        newUniqueParticipants.forEach((participant) => {
          currentTags.set(
            'p' + participant.pubkey,
            [
              'p',
              participant.pubkey,
              participant.relay || '',
              participant.role || '',
              participant.proof || '',
            ].filter(Boolean), // Filter out empty entries
          );
        });

        if (newUniqueParticipants.length > 0) {
          const currentParticipantsCount = currentTags.get('current_participants')
            ? Number(currentTags.get('current_participants')[1])
            : 0;

          const totalParticipantsCount = currentTags.get('total_participants')
            ? Number(currentTags.get('total_participants')[1])
            : 0;

          currentTags.set('current_participants', [
            'current_participants',
            (currentParticipantsCount + newUniqueParticipants.length).toString(),
          ]);

          currentTags.set('total_participants', [
            'total_participants',
            (totalParticipantsCount + newUniqueParticipants.length).toString(),
          ]);
        }
      }

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

      const event = new NDKEvent(ndk);
      event.kind = LIVE_EVENT_KIND;
      event.tags = Array.from(currentTags.values());
      event.content = '';

      event.publish();

      return event;
    },
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
      relay: '',
      role: t[3] ? t[3] : t[2],
      proof: t[4],
    }));

  return {
    identifier,
    created_at: event.created_at,
    content: event.content,
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
