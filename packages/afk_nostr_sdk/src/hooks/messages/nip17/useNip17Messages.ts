import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostrContext } from '../../../context/NostrContext';
import { useAuth } from '../../../store';
import { checkIsConnected } from '../../connect';
import { NDKKind } from '@nostr-dev-kit/ndk';
import { v2 } from "../../../utils/nip44";
import { deriveSharedKey, fixPubKey } from '../../../utils/keypair';

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
        eventsArray.map(event => decryptGiftWrapContent(event, privateKey, publicKey))
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
        eventsArray.map(event => decryptGiftWrapContent(event, privateKey, publicKey))
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

      console.log('NIP-17: Found', allEvents.length, 'gift wrap events');

      // Filter to ensure we only process actual gift wrap events
      const validGiftWrapEvents = allEvents.filter(event => {
        // Handle NDK events properly
        const plainEvent = event;

        const isValid = plainEvent && plainEvent.kind === 1059 && plainEvent.content && typeof plainEvent.content === 'string';
        if (!isValid) {
          console.warn('NIP-17: Skipping invalid gift wrap event:', {
            id: plainEvent?.id,
            kind: plainEvent?.kind,
            hasContent: !!plainEvent?.content,
            contentType: typeof plainEvent?.content
          });
        }
        return isValid;
      });

      console.log('NIP-17: Valid gift wrap events:', validGiftWrapEvents.length);

      // Decrypt all gift wrap events
      const decryptedEvents = await Promise.all(
        validGiftWrapEvents.map(async (event) => {
          console.log('NIP-17: Processing event:', {
            id: event.id,
            kind: event.kind,
            pubkey: event.pubkey,
            content: event.content,
            contentLength: event.content?.length,
            hasContent: !!event.content,
            tags: event.tags
          });
          return await decryptGiftWrapContent(event, privateKey, publicKey);
        })
      );

      console.log("decryptedEvents", decryptedEvents);
      const validEvents = decryptedEvents.filter(event => event !== null);
      console.log('NIP-17: Successfully decrypted', validEvents.length, 'out of', allEvents.length, 'events');

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

      const result = Array.from(conversations.values())
        .sort((a, b) => b.lastMessage.created_at - a.lastMessage.created_at);

      console.log('NIP-17: Found', result.length, 'conversations');
      return result;
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
        allEvents.map(event => decryptGiftWrapContent(event, privateKey, publicKey))
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