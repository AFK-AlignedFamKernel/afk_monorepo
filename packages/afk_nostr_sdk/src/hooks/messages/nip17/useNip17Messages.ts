import { useQuery, useInfiniteQuery, useMutation, useQueryClient, UseInfiniteQueryResult } from '@tanstack/react-query';
import { useNostrContext } from '../../../context/NostrContext';
import { useAuth } from '../../../store';
import { checkIsConnected } from '../../connect';
import { NDKKind } from '@nostr-dev-kit/ndk';
import { v2 } from "../../../utils/nip44";
import { deriveSharedKey, fixPubKey } from '../../../utils/keypair';
import { NDKEvent } from '@nostr-dev-kit/ndk';

export type UseNip17MessagesOptions = {
  authors?: string[];
  limit?: number;
  enabled?: boolean;
};

// Helper function to decrypt gift wrap content and extract NIP-44 message
const decryptGiftWrapContent = async (giftWrapEvent: any, privateKey: string, currentUserPublicKey: string) => {
  try {
    console.log('NIP-17: Attempting to decrypt event:', {
      id: giftWrapEvent?.id,
      kind: giftWrapEvent?.kind,
      pubkey: giftWrapEvent?.pubkey,
      contentLength: giftWrapEvent?.content?.length,
      contentType: typeof giftWrapEvent?.content,
      hasContent: !!giftWrapEvent?.content,
      content: giftWrapEvent?.content,
      tags: giftWrapEvent?.tags
    });

    // Validate inputs
    if (!giftWrapEvent || !giftWrapEvent.content || !giftWrapEvent.pubkey || !privateKey) {
      console.warn('Invalid gift wrap event or missing required fields');
      return null;
    }

    // Ensure content is a string
    if (typeof giftWrapEvent.content !== 'string') {
      console.warn('Gift wrap event content is not a string:', typeof giftWrapEvent.content);
      return null;
    }

    // Check if content is empty
    if (giftWrapEvent.content.trim() === '') {
      console.warn('Gift wrap event content is empty');
      return null;
    }

    // Check if this event is meant for us (we should be tagged as recipient)
    const recipientTag = giftWrapEvent.tags?.find(tag => tag[0] === 'p');
    if (!recipientTag || recipientTag[1] !== currentUserPublicKey) {
      console.warn('Gift wrap event is not meant for us:', recipientTag?.[1], 'vs', currentUserPublicKey);
      return null;
    }

    // Check if this event was sent by us (we can't decrypt our own sent messages)
    if (giftWrapEvent.pubkey === currentUserPublicKey) {
      console.warn('Gift wrap event was sent by us, skipping decryption');
      return null;
    }

    console.log('NIP-17: Attempting to decrypt content with length:', giftWrapEvent.content.length);

    // Decrypt the gift wrap content using NIP-44
    let decryptedContent;
    try {
      decryptedContent = v2.decryptNip44(giftWrapEvent.content, privateKey, giftWrapEvent.pubkey);
      console.log("NIP-17: Successfully decrypted gift wrap content using NIP-44");
    } catch (decryptError) {
      console.error('NIP-17: Failed to decrypt gift wrap content with NIP-44:', decryptError);
      console.error('NIP-17: Decrypt parameters:', {
        privateKeyLength: privateKey?.length,
        senderPubkey: giftWrapEvent.pubkey,
        contentLength: giftWrapEvent.content?.length,
        contentPreview: giftWrapEvent.content?.substring(0, 50)
      });
      return null;
    }

    if (!decryptedContent) {
      console.warn('Failed to decrypt gift wrap content');
      return null;
    }

    console.log('NIP-17: Successfully decrypted gift wrap content, length:', decryptedContent.length);

    // Parse the decrypted content as JSON (it should contain the seal event)
    let sealEvent;
    try {
      sealEvent = JSON.parse(decryptedContent);
    } catch (parseError) {
      console.error('NIP-17: Failed to parse decrypted content as JSON:', parseError);
      return null;
    }

    // Validate seal event structure
    if (!sealEvent || sealEvent.kind !== 13 || !sealEvent.content) {
      console.error('NIP-17: Invalid seal event structure:', sealEvent);
      return null;
    }

    // Decrypt the seal event content (the actual message)
    let actualMessage;
    try {
      actualMessage = v2.decryptNip44(sealEvent.content, privateKey, sealEvent.pubkey);
      console.log('NIP-17: Successfully decrypted seal event content');
    } catch (sealDecryptError) {
      console.error('NIP-17: Failed to decrypt seal event content:', sealDecryptError);
      return null;
    }

    console.log('NIP-17: Successfully decrypted seal event content, length:', actualMessage.length);

    return {
      ...giftWrapEvent,
      decryptedContent: actualMessage,
      sealEvent,
      // Add the actual sender pubkey from the seal event for proper conversation grouping
      actualSenderPubkey: sealEvent.pubkey,
      actualReceiverPubkey: sealEvent.tags?.find(tag => tag[0] === 'p')?.[1],
    };
  } catch (error) {
    console.error('Error decrypting gift wrap content:', error);
    return null;
  }
};

// Helper function to create and send NIP-17 gift wrap message using NIP-44
const createNip17Message = async (
  ndk: any,
  senderPrivateKey: string,
  receiverPublicKey: string,
  message: string
) => {
  // First, create the NIP-44 encrypted message (seal event content)
  const nip44EncryptedContent = v2.encryptNip44(message, senderPrivateKey, receiverPublicKey);

  // Create the seal event (kind 13)
  const sealEvent = {
    kind: 13,
    pubkey: receiverPublicKey,
    content: nip44EncryptedContent,
    tags: [['p', receiverPublicKey]],
    created_at: Math.floor(Date.now() / 1000),
  };

  // Encrypt the seal event for the gift wrap using NIP-44
  const giftWrapEncryptedContent = v2.encryptNip44(JSON.stringify(sealEvent), senderPrivateKey, receiverPublicKey);

  // Create the gift wrap event (kind 1059) using NDKEvent
  const giftWrapEvent = new NDKEvent(ndk);
  giftWrapEvent.kind = 1059;
  giftWrapEvent.content = giftWrapEncryptedContent;
  giftWrapEvent.tags = [['p', receiverPublicKey]];
  giftWrapEvent.created_at = Math.floor(Date.now() / 1000);

  // Sign and publish the gift wrap event
  await giftWrapEvent.sign();
  await giftWrapEvent.publish();

  return giftWrapEvent;
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

export const useNip17Messages = (options: UseNip17MessagesOptions = {}): UseInfiniteQueryResult<any, Error> => {
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
        eventsArray.map(event => decryptGiftWrapContent(event, privateKey, publicKey))
      );

      const validEvents = decryptedEvents.filter(event => event !== null);
      const nextCursor = eventsArray.length === limit ? eventsArray[eventsArray.length - 1]?.created_at : undefined;

      return {
        events: validEvents,
        nextCursor,
      };
    },
    enabled: options.enabled !== false && !!ndk && !!publicKey && !!privateKey,
    getNextPageParam: (lastPage: any) => lastPage.nextCursor,
    initialPageParam: 0,
  });
};

export const useNip17MessagesReceived = (options: UseNip17MessagesOptions = {}): UseInfiniteQueryResult<any, Error> => {
  const { ndk } = useNostrContext();
  const { publicKey, privateKey } = useAuth();

  return useInfiniteQuery({
    queryKey: ['nip17-messages-received', options.authors, options.limit, ndk],
    queryFn: async ({ pageParam = 0 }) => {
      if (!ndk || !publicKey || !privateKey) {
        return { events: [], nextCursor: undefined };
      }

      await checkIsConnected(ndk);

      const limit = options.limit || 50;

      // Fetch NIP-17 gift wrap events (kind 1059) where we are the recipient
      const events = await ndk.fetchEvents({
        kinds: [1059 as NDKKind], // Gift wrap events
        '#p': [publicKey], // We are tagged as recipient
        limit,
        ...(pageParam && { until: pageParam as number }),
      });

      const eventsArray = Array.from(events);

      // Decrypt gift wrap events to get actual messages
      const decryptedEvents = await Promise.all(
        eventsArray.map(event => decryptGiftWrapContent(event, privateKey, publicKey))
      );

      const validEvents = decryptedEvents.filter(event => event !== null);
      const nextCursor = eventsArray.length === limit ? eventsArray[eventsArray.length - 1]?.created_at : undefined;

      return {
        events: validEvents,
        nextCursor,
      };
    },
    enabled: options.enabled !== false && !!ndk && !!publicKey && !!privateKey,
    getNextPageParam: (lastPage: any) => lastPage.nextCursor,
    initialPageParam: 0,
  });
};

export const useNip17Conversations = (options: UseNip17MessagesOptions = {}): UseInfiniteQueryResult<any, Error> => {
  const { ndk } = useNostrContext();
  const { publicKey, privateKey } = useAuth();

  return useInfiniteQuery({
    queryKey: ['nip17-conversations', options.limit, ndk],
    queryFn: async ({ pageParam = 0 }) => {
      if (!ndk || !publicKey || !privateKey) {
        return { conversations: [], nextCursor: undefined };
      }

      await checkIsConnected(ndk);

      const limit = options.limit || 50;

      // Fetch both sent and received NIP-17 messages
      const [sentEvents, receivedEvents] = await Promise.all([
        ndk.fetchEvents({
          kinds: [1059 as NDKKind],
          authors: [publicKey],
          limit: limit / 2,
          ...(pageParam && { until: pageParam as number }),
        }),
        ndk.fetchEvents({
          kinds: [1059 as NDKKind],
          '#p': [publicKey],
          limit: limit / 2,
          ...(pageParam && { until: pageParam as number }),
        }),
      ]);

      const allEvents = [...Array.from(sentEvents), ...Array.from(receivedEvents)];

      // Decrypt all events to get the actual message data
      const decryptedEvents = await Promise.all(
        allEvents.map(event => decryptGiftWrapContent(event, privateKey, publicKey))
      );

      const validEvents = decryptedEvents.filter(event => event !== null);

      // Group messages by conversation using the actual sender/receiver pubkeys from seal events
      const conversationsMap = new Map<string, any>();

      for (const event of validEvents) {
        // Use the actual sender pubkey from the seal event for grouping
        const actualSenderPubkey = event.actualSenderPubkey;
        const actualReceiverPubkey = event.actualReceiverPubkey;
        
        // Determine the other participant in the conversation
        let otherParticipant;
        if (actualSenderPubkey === publicKey) {
          // We sent this message, so the other participant is the receiver
          otherParticipant = actualReceiverPubkey;
        } else {
          // We received this message, so the other participant is the sender
          otherParticipant = actualSenderPubkey;
        }

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

export const useNip17MessagesBetweenUsers = (otherUserPublicKey: string, options: UseNip17MessagesOptions = {}): UseInfiniteQueryResult<any, Error> => {
  const { ndk } = useNostrContext();
  const { publicKey, privateKey } = useAuth();

  return useInfiniteQuery({
    queryKey: ['nip17-messages-between', otherUserPublicKey, options.limit, ndk],
    queryFn: async ({ pageParam = 0 }) => {
      if (!ndk || !publicKey || !privateKey || !otherUserPublicKey) {
        return { messages: [], nextCursor: undefined };
      }

      await checkIsConnected(ndk);

      const limit = options.limit || 50;

      // Fetch messages between the two users
      const [sentEvents, receivedEvents] = await Promise.all([
        ndk.fetchEvents({
          kinds: [1059 as NDKKind],
          authors: [publicKey],
          '#p': [otherUserPublicKey],
          limit: limit / 2,
          ...(pageParam && { until: pageParam as number }),
        }),
        ndk.fetchEvents({
          kinds: [1059 as NDKKind],
          authors: [otherUserPublicKey],
          '#p': [publicKey],
          limit: limit / 2,
          ...(pageParam && { until: pageParam as number }),
        }),
      ]);

      const allEvents = [...Array.from(sentEvents), ...Array.from(receivedEvents)];

      // Decrypt all events
      const decryptedEvents = await Promise.all(
        allEvents.map(event => decryptGiftWrapContent(event, privateKey, publicKey))
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