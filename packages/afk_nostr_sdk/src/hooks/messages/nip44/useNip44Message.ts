import { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk';
import { useMutation, useInfiniteQuery, UseInfiniteQueryResult } from '@tanstack/react-query';
import { useNostrContext } from '../../../context/NostrContext';
import { useAuth, useSettingsStore } from '../../../store';
import { v2 } from '../../../utils/nip44';
import { checkIsConnected } from '../../connect';

export type UseNip44MessagesOptions = {
  authors?: string[];
  limit?: number;
  enabled?: boolean;
};

// Helper function to decrypt NIP-44 message
const decryptNip44Message = async (event: any, privateKey: string, currentUserPublicKey: string) => {
  try {
    console.log('NIP-44: Attempting to decrypt event:', {
      id: event?.id,
      kind: event?.kind,
      pubkey: event?.pubkey,
      contentLength: event?.content?.length,
    });

    // Validate inputs
    if (!event || !event.content || !event.pubkey || !privateKey) {
      console.warn('Invalid NIP-44 event or missing required fields');
      return null;
    }

    // Check if this event is meant for us (we should be tagged as recipient)
    const recipientTag = event.tags?.find(tag => tag[0] === 'p');
    if (!recipientTag || recipientTag[1] !== currentUserPublicKey) {
      console.warn('NIP-44 event is not meant for us:', recipientTag?.[1], 'vs', currentUserPublicKey);
      return null;
    }

    // Check if this event was sent by us (we can't decrypt our own sent messages)
    if (event.pubkey === currentUserPublicKey) {
      console.warn('NIP-44 event was sent by us, skipping decryption');
      return null;
    }

    // Decrypt the content using NIP-44
    let decryptedContent;
    try {
      decryptedContent = v2.decryptNip44(event.content, privateKey, event.pubkey);
      console.log('NIP-44: Successfully decrypted message');
    } catch (decryptError) {
      console.error('NIP-44: Failed to decrypt message:', decryptError);
      return null;
    }

    if (!decryptedContent) {
      console.warn('Failed to decrypt NIP-44 message');
      return null;
    }

    return {
      ...event,
      decryptedContent: decryptedContent,
    };
  } catch (error) {
    console.error('Error decrypting NIP-44 message:', error);
    return null;
  }
};

export const useNip44Message = () => {
  const { ndk } = useNostrContext();
  const { publicKey, privateKey } = useAuth();
  const { relays } = useSettingsStore();

  return useMutation({
    mutationKey: ['sendNip44Message', ndk],
    mutationFn: async (data: {
      content: string;
      receiverPublicKey: string;
      relayUrl?: string;
      subject?: string;
      tags?: string[][];
    }) => {
      const { relayUrl, receiverPublicKey, content, subject } = data;

      await checkIsConnected(ndk);
      console.log('NIP-44: Sending message', {
        contentLength: content.length,
        receiverPublicKey,
        hasPrivateKey: !!privateKey,
        hasPublicKey: !!publicKey
      });

      if (!privateKey || !publicKey) {
        throw new Error('Private key and public key are required for NIP-44 encryption');
      }

      if (!receiverPublicKey) {
        throw new Error('Receiver public key is required');
      }

      // Encrypt content using NIP-44
      const encryptedContent = v2.encryptNip44(content, privateKey, receiverPublicKey);

      // Create and send event
      const eventDirectMessage = new NDKEvent(ndk);
      eventDirectMessage.kind = NDKKind.EncryptedDirectMessage;
      eventDirectMessage.created_at = Math.floor(Date.now() / 1000);
      eventDirectMessage.content = encryptedContent;
      eventDirectMessage.tags = [
        ["p", receiverPublicKey, relayUrl || ""],
        ...(subject ? [["subject", subject]] : []),
      ];

      // Sign the event
      await eventDirectMessage.sign();

      console.log('NIP-44: Publishing event:', {
        id: eventDirectMessage.id,
        pubkey: eventDirectMessage.pubkey,
        kind: eventDirectMessage.kind,
        contentLength: encryptedContent.length,
        tags: eventDirectMessage.tags,
      });

      // Publish with better error handling
      try {
        const publishResult = await eventDirectMessage.publish();
        console.log('NIP-44: Message published successfully:', publishResult);
        return eventDirectMessage;
      } catch (error) {
        console.error('Failed to publish NIP-44 message:', error);
        
        // Try to get more details about the failure
        const connectedRelays = ndk.pool.connectedRelays();
        console.log('Connected relays:', connectedRelays.map(r => r.url));
        
        throw new Error(`Failed to publish NIP-44 message: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  });
};

// Hook for decrypting NIP-44 messages
export const useNip44Decrypt = () => {
  const { privateKey, publicKey } = useAuth();

  const decryptMessage = async (encryptedContent: string, senderPublicKey: string): Promise<string> => {
    if (!privateKey || !publicKey) {
      throw new Error('Private key and public key are required for NIP-44 decryption');
    }

    try {
      // Determine which public key to use for decryption
      // If we're the sender, use the receiver's public key
      // If we're the receiver, use the sender's public key
      const otherPublicKey = senderPublicKey === publicKey ? publicKey : senderPublicKey;
      
      const decryptedContent = v2.decryptNip44(encryptedContent, privateKey, otherPublicKey);
      return decryptedContent;
    } catch (error) {
      console.error('NIP-44: Failed to decrypt message:', error);
      throw new Error(`Failed to decrypt NIP-44 message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return { decryptMessage };
};

// Hook for fetching NIP-44 conversations
export const useNip44Conversations = (options: UseNip44MessagesOptions = {}): UseInfiniteQueryResult<any, Error> => {
  const { ndk } = useNostrContext();
  const { publicKey, privateKey } = useAuth();

  return useInfiniteQuery({
    queryKey: ['nip44-conversations', options.limit, ndk],
    queryFn: async ({ pageParam = 0 }) => {
      if (!ndk || !publicKey || !privateKey) {
        return { conversations: [], nextCursor: undefined };
      }

      await checkIsConnected(ndk);

      const limit = options.limit || 50;

      // Fetch both sent and received NIP-44 messages
      const [sentEvents, receivedEvents] = await Promise.all([
        ndk.fetchEvents({
          kinds: [NDKKind.EncryptedDirectMessage],
          authors: [publicKey],
          limit: limit / 2,
          ...(pageParam && { until: pageParam as number }),
        }),
        ndk.fetchEvents({
          kinds: [NDKKind.EncryptedDirectMessage],
          '#p': [publicKey],
          limit: limit / 2,
          ...(pageParam && { until: pageParam as number }),
        }),
      ]);

      const allEvents = [...Array.from(sentEvents), ...Array.from(receivedEvents)];

      // Decrypt all events to get the actual message data
      const decryptedEvents = await Promise.all(
        allEvents.map(event => decryptNip44Message(event, privateKey, publicKey))
      );

      const validEvents = decryptedEvents.filter(event => event !== null);

      // Group messages by conversation
      const conversationsMap = new Map<string, any>();

      for (const event of validEvents) {
        // Determine the other participant in the conversation
        const otherParticipant = event.pubkey === publicKey 
          ? event.tags?.find(tag => tag[0] === 'p')?.[1]
          : event.pubkey;

        if (otherParticipant && otherParticipant !== publicKey) {
          if (!conversationsMap.has(otherParticipant)) {
            conversationsMap.set(otherParticipant, {
              participant: otherParticipant,
              lastMessage: event,
              messageCount: 0,
              lastMessageContent: event.decryptedContent,
              lastMessageTime: event.created_at,
            });
          }

          const conversation = conversationsMap.get(otherParticipant);
          conversation.messageCount++;
          
          // Update last message if this one is newer
          if (!conversation.lastMessage || event.created_at > conversation.lastMessage.created_at) {
            conversation.lastMessage = event;
            conversation.lastMessageContent = event.decryptedContent;
            conversation.lastMessageTime = event.created_at;
          }
        }
      }

      const conversations = Array.from(conversationsMap.values())
        .sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0));

      const nextCursor = allEvents.length === limit ? allEvents[allEvents.length - 1]?.created_at : undefined;

      return {
        conversations,
        nextCursor,
      };
    },
    enabled: options.enabled !== false && !!ndk && !!publicKey && !!privateKey,
    getNextPageParam: (lastPage: any) => lastPage.nextCursor,
    initialPageParam: 0,
  });
};

// Hook for fetching NIP-44 messages between two users
export const useNip44MessagesBetweenUsers = (otherUserPublicKey: string, options: UseNip44MessagesOptions = {}): UseInfiniteQueryResult<any, Error> => {
  const { ndk } = useNostrContext();
  const { publicKey, privateKey } = useAuth();

  return useInfiniteQuery({
    queryKey: ['nip44-messages-between', otherUserPublicKey, options.limit, ndk],
    queryFn: async ({ pageParam = 0 }) => {
      if (!ndk || !publicKey || !privateKey || !otherUserPublicKey) {
        return { messages: [], nextCursor: undefined };
      }

      await checkIsConnected(ndk);

      const limit = options.limit || 50;

      // Fetch messages between the two users
      const [sentEvents, receivedEvents] = await Promise.all([
        ndk.fetchEvents({
          kinds: [NDKKind.EncryptedDirectMessage],
          authors: [publicKey],
          '#p': [otherUserPublicKey],
          limit: limit / 2,
          ...(pageParam && { until: pageParam as number }),
        }),
        ndk.fetchEvents({
          kinds: [NDKKind.EncryptedDirectMessage],
          authors: [otherUserPublicKey],
          '#p': [publicKey],
          limit: limit / 2,
          ...(pageParam && { until: pageParam as number }),
        }),
      ]);

      const allEvents = [...Array.from(sentEvents), ...Array.from(receivedEvents)];

      // Decrypt all events
      const decryptedEvents = await Promise.all(
        allEvents.map(event => decryptNip44Message(event, privateKey, publicKey))
      );

      const validMessages = decryptedEvents
        .filter(event => event !== null)
        .sort((a, b) => (a?.created_at || 0) - (b?.created_at || 0));

      const nextCursor = allEvents.length === limit ? allEvents[allEvents.length - 1]?.created_at : undefined;

      return {
        messages: validMessages,
        nextCursor,
      };
    },
    enabled: options.enabled !== false && !!ndk && !!publicKey && !!privateKey && !!otherUserPublicKey,
    getNextPageParam: (lastPage: any) => lastPage.nextCursor,
    initialPageParam: 0,
  });
}; 