import {NDKEvent, NDKFilter} from '@nostr-dev-kit/ndk';
import {useMutation, useQuery} from '@tanstack/react-query';

import {useNostrContext} from '../../context';
import {useAuth} from '../../store';

// Custom kinds for Live Activities
const LIVE_EVENT_KIND = 30311;
const LIVE_CHAT_KIND = 1311;

// Types
type LiveEventStatus = 'planned' | 'live' | 'ended';

interface Participant {
  pubkey: string;
  relay?: string;
  role: string;
  proof?: string;
}

interface LiveEventData {
  identifier: string;
  title?: string;
  summary?: string;
  imageUrl?: string;
  hashtags?: string[];
  streamingUrl?: string;
  recordingUrl?: string;
  startsAt?: number;
  endsAt?: number;
  status: LiveEventStatus;
  currentParticipants?: number;
  totalParticipants?: number;
  participants: Participant[];
  relays?: string[];
}

interface LiveChatMessage {
  eventId: string;
  content: string;
}

// Helper function to generate proof
const generateParticipantProof = async (
  privateKey: string,
  kind: number,
  pubkey: string,
  identifier: string,
): Promise<string> => {
  const tag = `${kind}:${pubkey}:${identifier}`;
  //Todo: Implementation of signing would go here
  return 'proof';
};

export const useLiveActivity = (eventId?: string) => {
  const {ndk} = useNostrContext();
  const {publicKey: currentUserPubkey} = useAuth();

  // Create or update live event
  const createLiveEvent = useMutation({
    mutationKey: ['createLiveEvent', ndk],
    mutationFn: async (data: LiveEventData) => {
      const event = new NDKEvent(ndk);
      event.kind = LIVE_EVENT_KIND;

      // Build tags according to NIP-30311
      const tags: string[][] = [['d', data.identifier]];

      if (data.title) tags.push(['title', data.title]);
      if (data.summary) tags.push(['summary', data.summary]);
      if (data.imageUrl) tags.push(['image', data.imageUrl]);
      if (data.streamingUrl) tags.push(['streaming', data.streamingUrl]);
      if (data.recordingUrl) tags.push(['recording', data.recordingUrl]);
      if (data.startsAt) tags.push(['starts', data.startsAt.toString()]);
      if (data.endsAt) tags.push(['ends', data.endsAt.toString()]);
      tags.push(['status', data.status]);

      if (data.currentParticipants) {
        tags.push(['current_participants', data.currentParticipants.toString()]);
      }
      if (data.totalParticipants) {
        tags.push(['total_participants', data.totalParticipants.toString()]);
      }

      // Add participants
      data.participants.forEach((participant) => {
        tags.push([
          'p',
          participant.pubkey,
          participant.relay || '',
          participant.role,
          participant.proof || '',
        ]);
      });

      // Add relays
      if (data.relays?.length) {
        tags.push(['relays', ...data.relays]);
      }

      // Add hashtags
      data.hashtags?.forEach((tag) => {
        tags.push(['t', tag]);
      });

      event.tags = tags;
      event.content = '';

      return event.publish();
    },
  });

  // Send live chat message
  const sendChatMessage = useMutation({
    mutationKey: ['sendLiveChatMessage', ndk],
    mutationFn: async (data: LiveChatMessage) => {
      const event = new NDKEvent(ndk);
      event.kind = LIVE_CHAT_KIND;
      event.tags = [['a', `${LIVE_EVENT_KIND}:${currentUserPubkey}:${data.eventId}`, '', 'root']];
      event.content = data.content;
      return event.publish();
    },
  });

  // Subscribe to live event updates
  const {data: liveEvent} = useQuery({
    queryKey: ['liveEvent', eventId],
    enabled: !!eventId && !!ndk,
    queryFn: async () => {
      const filter: NDKFilter = {
        kinds: [LIVE_EVENT_KIND as any],
        '#d': [eventId!],
      };

      const events = await ndk.fetchEvents(filter);
      return Array.from(events)[0];
    },
  });

  // Subscribe to live chat messages
  const {data: chatMessages} = useQuery({
    queryKey: ['liveChatMessages', eventId],
    enabled: !!eventId && !!ndk,
    queryFn: async () => {
      const filter: NDKFilter = {
        kinds: [LIVE_CHAT_KIND as any],
        '#a': [`${LIVE_EVENT_KIND}:${currentUserPubkey}:${eventId}`],
      };

      const events = await ndk.fetchEvents(filter);
      return Array.from(events);
    },
  });

  // Parse live event data
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
      participants,
      hashtags: event.tags.filter((t) => t[0] === 't').map((t) => t[1]),
      relays: event.tags.find((t) => t[0] === 'relays')?.slice(1),
    };
  };

  return {
    createLiveEvent,
    sendChatMessage,
    liveEvent: liveEvent ? parseLiveEventData(liveEvent) : null,
    chatMessages,
  };
};
