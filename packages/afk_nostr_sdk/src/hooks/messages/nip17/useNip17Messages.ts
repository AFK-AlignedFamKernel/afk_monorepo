import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { useNostrContext } from '../../../context/NostrContext';
import { useAuth } from '../../../store';
import { checkIsConnected } from '../../connect';
import { NDKKind } from '@nostr-dev-kit/ndk';

export type UseNip17MessagesOptions = {
  authors?: string[];
  limit?: number;
  enabled?: boolean;
};

export const useNip17Messages = (options: UseNip17MessagesOptions = {}) => {
  const { ndk } = useNostrContext();
  const { publicKey, privateKey } = useAuth();

  return useInfiniteQuery({
    queryKey: ['nip17-messages', options.authors, options.limit, ndk],
    queryFn: async ({ pageParam = 0 }) => {
      if (!ndk || !publicKey || !privateKey) {
        return { events: [], nextCursor: undefined };
      }

      await checkIsConnected(ndk);

      const limit = options.limit || 50;
      const authors = options.authors || [publicKey];

      // Fetch NIP-17 messages (kind 4 - encrypted direct messages)
      const events = await ndk.fetchEvents({
        kinds: [NDKKind.EncryptedDirectMessage],
        authors,
        limit,
        ...(pageParam && { until: pageParam as number }),
      });

      const eventsArray = Array.from(events);
      const nextCursor = eventsArray.length === limit ? eventsArray[eventsArray.length - 1]?.created_at : undefined;

      return {
        events: eventsArray,
        nextCursor,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: options.enabled !== false && !!ndk && !!publicKey && !!privateKey,
    initialPageParam: 0,
  });
};

export const useNip17MessagesReceived = (options: UseNip17MessagesOptions = {}) => {
  const { ndk } = useNostrContext();
  const { publicKey, privateKey } = useAuth();

  return useInfiniteQuery({
    queryKey: ['nip17-messages-received', publicKey, options.limit, ndk],
    queryFn: async ({ pageParam = 0 }) => {
      if (!ndk || !publicKey || !privateKey) {
        return { events: [], nextCursor: undefined };
      }

      await checkIsConnected(ndk);

      const limit = options.limit || 50;

      // Fetch NIP-17 messages received by the current user
      const events = await ndk.fetchEvents({
        kinds: [1059 as NDKKind],
        '#p': [publicKey], // Messages where current user is tagged as recipient
        limit,
        ...(pageParam && { until: pageParam as number }),
      });

      const eventsArray = Array.from(events);
      const nextCursor = eventsArray.length === limit ? eventsArray[eventsArray.length - 1]?.created_at : undefined;

      return {
        events: eventsArray,
        nextCursor,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: options.enabled !== false && !!ndk && !!publicKey && !!privateKey,
    initialPageParam: 0,
  });
};

export const useNip17Conversations = (options: UseNip17MessagesOptions = {}) => {
  const { ndk } = useNostrContext();
  const { publicKey, privateKey } = useAuth();

  return useQuery({
    queryKey: ['nip17-conversations', publicKey, ndk],
    queryFn: async () => {
      if (!ndk || !publicKey || !privateKey) {
        return [];
      }

      await checkIsConnected(ndk);

      // Fetch both sent and received NIP-17 messages
      const [sentEvents, receivedEvents] = await Promise.all([
        ndk.fetchEvents({
          kinds: [NDKKind.EncryptedDirectMessage],
          authors: [publicKey],
          limit: 100,
        }),
        ndk.fetchEvents({
          kinds: [NDKKind.EncryptedDirectMessage],
          '#p': [publicKey],
          limit: 100,
        }),
      ]);

      const allEvents = [...Array.from(sentEvents), ...Array.from(receivedEvents)];
      
      // Group by conversation (other participant)
      const conversations = new Map();
      
      allEvents.forEach(event => {
        const otherParticipant = event.pubkey === publicKey 
          ? event.tags?.find(tag => tag[0] === 'p')?.[1]
          : event.pubkey;
        
        if (otherParticipant && otherParticipant !== publicKey) {
          if (!conversations.has(otherParticipant)) {
            conversations.set(otherParticipant, {
              participant: otherParticipant,
              lastMessage: event,
              messageCount: 0,
            });
          }
          
          const conversation = conversations.get(otherParticipant);
          conversation.messageCount++;
          
          // Update last message if this one is newer
          if (event.created_at > conversation.lastMessage.created_at) {
            conversation.lastMessage = event;
          }
        }
      });

      return Array.from(conversations.values())
        .sort((a, b) => b.lastMessage.created_at - a.lastMessage.created_at);
    },
    enabled: options.enabled !== false && !!ndk && !!publicKey && !!privateKey,
  });
};

export const useNip17MessagesBetweenUsers = (otherUserPublicKey: string, options: UseNip17MessagesOptions = {}) => {
  const { ndk } = useNostrContext();
  const { publicKey, privateKey } = useAuth();

  return useInfiniteQuery({
    queryKey: ['nip17-messages-between', publicKey, otherUserPublicKey, options.limit, ndk],
    queryFn: async ({ pageParam = 0 }) => {
      if (!ndk || !publicKey || !privateKey || !otherUserPublicKey) {
        return { events: [], nextCursor: undefined };
      }

      await checkIsConnected(ndk);

      const limit = options.limit || 50;

      // Fetch NIP-17 messages between the two users
      const [sentEvents, receivedEvents] = await Promise.all([
        ndk.fetchEvents({
          kinds: [NDKKind.EncryptedDirectMessage],
          authors: [publicKey],
          '#p': [otherUserPublicKey],
          limit,
          ...(pageParam && { until: pageParam as number }),
        }),
        ndk.fetchEvents({
          kinds: [NDKKind.EncryptedDirectMessage],
          authors: [otherUserPublicKey],
          '#p': [publicKey],
          limit,
          ...(pageParam && { until: pageParam as number }),
        }),
      ]);

      const allEvents = [...Array.from(sentEvents), ...Array.from(receivedEvents)];
      const sortedEvents = allEvents.sort((a, b) => a.created_at - b.created_at);
      
      const nextCursor = sortedEvents.length === limit ? sortedEvents[sortedEvents.length - 1]?.created_at : undefined;

      return {
        events: sortedEvents,
        nextCursor,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: options.enabled !== false && !!ndk && !!publicKey && !!privateKey && !!otherUserPublicKey,
    initialPageParam: 0,
  });
}; 