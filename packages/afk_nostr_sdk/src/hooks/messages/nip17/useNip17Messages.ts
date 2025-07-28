import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostrContext } from '../../../context/NostrContext';
import { useAuth } from '../../../store';
import { checkIsConnected } from '../../connect';
import { NDKKind } from '@nostr-dev-kit/ndk';
import { nip04 } from 'nostr-tools';

export type UseNip17MessagesOptions = {
  authors?: string[];
  limit?: number;
  enabled?: boolean;
};

// Helper function to decrypt gift wrap content and extract NIP-4 message
const decryptGiftWrapContent = async (giftWrapEvent: any, privateKey: string) => {
  try {
    // Decrypt the gift wrap content
    const decryptedContent = await nip04.decrypt(privateKey, giftWrapEvent.pubkey, giftWrapEvent.content);
    
    // Parse the decrypted content as a seal event (kind 13)
    const sealEvent = JSON.parse(decryptedContent);
    
    if (sealEvent.kind !== 13) {
      throw new Error('Invalid seal event kind');
    }
    
    // Decrypt the seal event content to get the actual NIP-4 message
    const actualMessage = await nip04.decrypt(privateKey, sealEvent.pubkey, sealEvent.content);
    
    return {
      ...giftWrapEvent,
      decryptedContent: actualMessage,
      sealEvent,
    };
  } catch (error) {
    console.error('Error decrypting gift wrap content:', error);
    return null;
  }
};

// Helper function to create and send NIP-17 gift wrap message
const createNip17Message = async (
  ndk: any,
  senderPrivateKey: string,
  receiverPublicKey: string,
  message: string
) => {
  // First, create the NIP-4 encrypted message (seal event content)
  const nip4EncryptedContent = await nip04.encrypt(senderPrivateKey, receiverPublicKey, message);
  
  // Create the seal event (kind 13)
  const sealEvent = {
    kind: 13,
    pubkey: receiverPublicKey,
    content: nip4EncryptedContent,
    tags: [['p', receiverPublicKey]],
    created_at: Math.floor(Date.now() / 1000),
  };
  
  // Encrypt the seal event for the gift wrap
  const giftWrapEncryptedContent = await nip04.encrypt(senderPrivateKey, receiverPublicKey, JSON.stringify(sealEvent));
  
  // Create the gift wrap event (kind 1059)
  const giftWrapEvent = {
    kind: 1059,
    content: giftWrapEncryptedContent,
    tags: [['p', receiverPublicKey]],
    created_at: Math.floor(Date.now() / 1000),
  };
  
  // Sign and publish the gift wrap event
  const signedEvent = await ndk.signEvent(giftWrapEvent);
  await ndk.publish(signedEvent);
  
  return signedEvent;
};

export const useSendNip17Message = () => {
  const { ndk } = useNostrContext();
  const { publicKey, privateKey } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ receiverPublicKey, message }: { receiverPublicKey: string; message: string }) => {
      if (!ndk || !publicKey || !privateKey) {
        throw new Error('NDK, public key, or private key not available');
      }

      await checkIsConnected(ndk);
      
      return await createNip17Message(ndk, privateKey, receiverPublicKey, message);
    },
    onSuccess: () => {
      // Invalidate and refetch NIP-17 related queries
      queryClient.invalidateQueries({ queryKey: ['nip17-messages'] });
      queryClient.invalidateQueries({ queryKey: ['nip17-conversations'] });
      queryClient.invalidateQueries({ queryKey: ['nip17-messages-between'] });
    },
  });
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

      // Fetch NIP-17 gift wrap events (kind 1059)
      const events = await ndk.fetchEvents({
        kinds: [1059 as NDKKind], // Gift wrap events
        authors,
        limit,
        ...(pageParam && { until: pageParam as number }),
      });

      const eventsArray = Array.from(events);
      
      // Decrypt gift wrap events to get actual messages
      const decryptedEvents = await Promise.all(
        eventsArray.map(event => decryptGiftWrapContent(event, privateKey))
      );
      
      const validEvents = decryptedEvents.filter(event => event !== null);
      const nextCursor = eventsArray.length === limit ? eventsArray[eventsArray.length - 1]?.created_at : undefined;

      return {
        events: validEvents,
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

      // Fetch NIP-17 gift wrap events received by the current user
      const events = await ndk.fetchEvents({
        kinds: [1059 as NDKKind], // Gift wrap events
        '#p': [publicKey], // Messages where current user is tagged as recipient
        limit,
        ...(pageParam && { until: pageParam as number }),
      });

      const eventsArray = Array.from(events);
      
      // Decrypt gift wrap events to get actual messages
      const decryptedEvents = await Promise.all(
        eventsArray.map(event => decryptGiftWrapContent(event, privateKey))
      );
      
      const validEvents = decryptedEvents.filter(event => event !== null);
      const nextCursor = eventsArray.length === limit ? eventsArray[eventsArray.length - 1]?.created_at : undefined;

      return {
        events: validEvents,
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

      // Fetch both sent and received NIP-17 gift wrap events
      const [sentEvents, receivedEvents] = await Promise.all([
        ndk.fetchEvents({
          kinds: [1059 as NDKKind], // Gift wrap events
          authors: [publicKey],
          limit: 100,
        }),
        ndk.fetchEvents({
          kinds: [1059 as NDKKind], // Gift wrap events
          '#p': [publicKey],
          limit: 100,
        }),
      ]);

      const allEvents = [...Array.from(sentEvents), ...Array.from(receivedEvents)];
      
      // Decrypt all gift wrap events
      const decryptedEvents = await Promise.all(
        allEvents.map(event => decryptGiftWrapContent(event, privateKey))
      );
      
      const validEvents = decryptedEvents.filter(event => event !== null);
      
      // Group by conversation (other participant)
      const conversations = new Map();
      
      validEvents.forEach(event => {
        // Extract the other participant from the seal event
        const otherParticipant = event.sealEvent.pubkey === publicKey 
          ? event.sealEvent.tags?.find(tag => tag[0] === 'p')?.[1]
          : event.sealEvent.pubkey;
        
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

      // Fetch NIP-17 gift wrap events between the two users
      const [sentEvents, receivedEvents] = await Promise.all([
        ndk.fetchEvents({
          kinds: [1059 as NDKKind], // Gift wrap events
          authors: [publicKey],
          '#p': [otherUserPublicKey],
          limit,
          ...(pageParam && { until: pageParam as number }),
        }),
        ndk.fetchEvents({
          kinds: [1059 as NDKKind], // Gift wrap events
          authors: [otherUserPublicKey],
          '#p': [publicKey],
          limit,
          ...(pageParam && { until: pageParam as number }),
        }),
      ]);

      const allEvents = [...Array.from(sentEvents), ...Array.from(receivedEvents)];
      
      // Decrypt all gift wrap events
      const decryptedEvents = await Promise.all(
        allEvents.map(event => decryptGiftWrapContent(event, privateKey))
      );
      
      const validEvents = decryptedEvents.filter(event => event !== null);
      const sortedEvents = validEvents.sort((a, b) => a.created_at - b.created_at);
      
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