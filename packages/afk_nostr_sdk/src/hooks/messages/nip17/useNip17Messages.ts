import { useQuery, useInfiniteQuery, useMutation, useQueryClient, UseInfiniteQueryResult } from '@tanstack/react-query';
import { useNostrContext } from '../../../context/NostrContext';
import { useAuth } from '../../../store';
import { checkIsConnected } from '../../connect';
import { NDKKind } from '@nostr-dev-kit/ndk';
import { v2 } from "../../../utils/nip44";
import { deriveSharedKey, fixPubKey } from '../../../utils/keypair';
import { NDKEvent } from '@nostr-dev-kit/ndk';
import { useSettingsStore } from '../../../store/settings';

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

    // Check if this event is meant for us (we should be tagged as recipient OR be the sender)
    const recipientTag = giftWrapEvent.tags?.find(tag => tag[0] === 'p');
    const isRecipient = recipientTag && recipientTag[1] === currentUserPublicKey;
    const isSender = giftWrapEvent.pubkey === currentUserPublicKey;
    
    if (!isRecipient && !isSender) {
      console.warn('Gift wrap event is not meant for us:', recipientTag?.[1], 'vs', currentUserPublicKey);
      console.log('NIP-17: Skipping event with tags:', giftWrapEvent.tags);
      return null;
    }

    console.log('NIP-17: Attempting to decrypt content with length:', giftWrapEvent.content.length);

    // Try both decryption methods: old method first, then NIP-44
    let decryptedContent = null;
    let decryptionMethod = '';

    // Method 1: Try old encryption method (deriveSharedKey + v2.decrypt)
    try {
      const senderPublicKey = giftWrapEvent.pubkey;
      const receiverPublicKey = giftWrapEvent.tags?.find(tag => tag[0] === 'p')?.[1];
      
      if (!receiverPublicKey) {
        console.warn('No receiver public key found in tags');
        return null;
      }

      const isSender = currentUserPublicKey === senderPublicKey;
      const isRecipient = currentUserPublicKey === receiverPublicKey;

      if (!isSender && !isRecipient) {
        console.warn('User is neither sender nor recipient');
        return null;
      }

      // For messages we sent, we need to use the receiver's public key to derive the conversation key
      // For messages we received, we use the sender's public key
      const conversationKey = isSender
        ? deriveSharedKey(privateKey, fixPubKey(receiverPublicKey))
        : deriveSharedKey(privateKey, fixPubKey(senderPublicKey));

      if (conversationKey) {
        decryptedContent = v2.decrypt(giftWrapEvent.content, conversationKey);
        decryptionMethod = 'old_method';
        console.log("NIP-17: Successfully decrypted gift wrap content using old method", { isSender, isRecipient });
      }
    } catch (oldMethodError) {
      console.log('NIP-17: Old decryption method failed, trying NIP-44:', oldMethodError);
    }

    // Method 2: Try NIP-44 decryption if old method failed
    if (!decryptedContent) {
      try {
        const senderPublicKey = giftWrapEvent.pubkey;
        const receiverPublicKey = giftWrapEvent.tags?.find(tag => tag[0] === 'p')?.[1];
        const isSender = currentUserPublicKey === senderPublicKey;
        
        // For NIP-44, we need to use the other party's public key for decryption
        const otherPartyPubkey = isSender ? receiverPublicKey : senderPublicKey;
        
        if (!otherPartyPubkey) {
          console.warn('No other party public key found for NIP-44 decryption');
          return null;
        }
        
        decryptedContent = v2.decryptNip44(giftWrapEvent.content, privateKey, otherPartyPubkey);
        decryptionMethod = 'nip44';
        console.log("NIP-17: Successfully decrypted gift wrap content using NIP-44", { isSender, otherPartyPubkey });
      } catch (nip44Error) {
        console.error('NIP-17: Failed to decrypt gift wrap content with NIP-44:', nip44Error);
        console.error('NIP-17: Decrypt parameters:', {
          privateKeyLength: privateKey?.length,
          senderPubkey: giftWrapEvent.pubkey,
          contentLength: giftWrapEvent.content?.length,
          contentPreview: giftWrapEvent.content?.substring(0, 50)
        });
        return null;
      }
    }

    if (!decryptedContent) {
      console.warn('Failed to decrypt gift wrap content with both methods');
      return null;
    }

    console.log('NIP-17: Successfully decrypted gift wrap content, length:', decryptedContent.length, 'method:', decryptionMethod);

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

    // Decrypt the seal event content (the actual message) using both methods
    let actualMessage;
    let sealDecryptionMethod = '';

    console.log('NIP-17: Seal event structure:', {
      kind: sealEvent.kind,
      pubkey: sealEvent.pubkey,
      contentLength: sealEvent.content?.length,
      tags: sealEvent.tags
    });

    // Method 1: Try old encryption method for seal event
    try {
      const senderPublicKey = giftWrapEvent.pubkey;
      const receiverPublicKey = giftWrapEvent.tags?.find(tag => tag[0] === 'p')?.[1];
      
      const isSender = currentUserPublicKey === senderPublicKey;
      const isRecipient = currentUserPublicKey === receiverPublicKey;

      const conversationKey = isSender
        ? deriveSharedKey(privateKey, fixPubKey(receiverPublicKey))
        : deriveSharedKey(privateKey, fixPubKey(senderPublicKey));

      actualMessage = v2.decrypt(sealEvent.content, conversationKey);
      sealDecryptionMethod = 'old_method';
      console.log('NIP-17: Successfully decrypted seal event content using old method');
    } catch (oldSealMethodError) {
      console.log('NIP-17: Old seal decryption method failed, trying NIP-44:', oldSealMethodError);
    }

    // Method 2: Try NIP-44 decryption for seal event if old method failed
    if (!actualMessage) {
      try {
        const senderPublicKey = giftWrapEvent.pubkey;
        const receiverPublicKey = giftWrapEvent.tags?.find(tag => tag[0] === 'p')?.[1];
        const isSender = currentUserPublicKey === senderPublicKey;
        
        // For NIP-44 seal event decryption, use the other party's public key
        const otherPartyPubkey = isSender ? receiverPublicKey : senderPublicKey;
        
        if (!otherPartyPubkey) {
          console.warn('No other party public key found for NIP-44 seal decryption');
          return null;
        }
        
        actualMessage = v2.decryptNip44(sealEvent.content, privateKey, otherPartyPubkey);
        sealDecryptionMethod = 'nip44';
        console.log('NIP-17: Successfully decrypted seal event content using NIP-44');
      } catch (nip44SealError) {
        console.error('NIP-17: Failed to decrypt seal event content with NIP-44:', nip44SealError);
        
        // Try one more approach: use the seal event's own pubkey for decryption
        try {
          actualMessage = v2.decryptNip44(sealEvent.content, privateKey, sealEvent.pubkey);
          sealDecryptionMethod = 'nip44_seal_pubkey';
          console.log('NIP-17: Successfully decrypted seal event content using seal pubkey');
        } catch (finalError) {
          console.error('NIP-17: All seal decryption methods failed:', finalError);
          return null;
        }
      }
    }

    if (!actualMessage) {
      console.error('NIP-17: Failed to decrypt seal event content with all methods');
      return null;
    }

    console.log('NIP-17: Successfully decrypted seal event content, length:', actualMessage.length);

    // Extract the actual sender and receiver from the seal event
    const sealRecipientTag = sealEvent.tags?.find(tag => tag[0] === 'p');
    const actualSenderPubkey = sealEvent.pubkey;
    const actualReceiverPubkey = sealRecipientTag?.[1];

    console.log('NIP-17: Seal event participants:', {
      actualSenderPubkey,
      actualReceiverPubkey,
      currentUserPublicKey
    });

    return {
      ...giftWrapEvent,
      decryptedContent: actualMessage,
      sealEvent,
      // Add the actual sender pubkey from the seal event for proper conversation grouping
      actualSenderPubkey,
      actualReceiverPubkey,
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
  senderPublicKey: string,
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

  // Create two gift wrap events: one for sender, one for receiver
  const sealEventJson = JSON.stringify(sealEvent);
  
  // Gift wrap for receiver (encrypted with receiver's public key)
  const receiverGiftWrapContent = v2.encryptNip44(sealEventJson, senderPrivateKey, receiverPublicKey);
  const receiverGiftWrapEvent = new NDKEvent(ndk);
  receiverGiftWrapEvent.kind = 1059;
  receiverGiftWrapEvent.content = receiverGiftWrapContent;
  receiverGiftWrapEvent.tags = [['p', receiverPublicKey]];
  receiverGiftWrapEvent.created_at = Math.floor(Date.now() / 1000);

  // Gift wrap for sender (encrypted with sender's public key for their own decryption)
  const senderGiftWrapContent = v2.encryptNip44(sealEventJson, senderPrivateKey, senderPublicKey);
  const senderGiftWrapEvent = new NDKEvent(ndk);
  senderGiftWrapEvent.kind = 1059;
  senderGiftWrapEvent.content = senderGiftWrapContent;
  senderGiftWrapEvent.tags = [['p', senderPublicKey]]; // Tag with sender's pubkey
  senderGiftWrapEvent.created_at = Math.floor(Date.now() / 1000);

  // Sign and publish both gift wrap events
  await receiverGiftWrapEvent.sign();
  await senderGiftWrapEvent.sign();
  
  await receiverGiftWrapEvent.publish();
  await senderGiftWrapEvent.publish();

  return { receiverGiftWrapEvent, senderGiftWrapEvent };
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

      return await createNip17Message(ndk, privateKey, publicKey, receiverPublicKey, message);
    },
    onSuccess: () => {
      // Invalidate and refetch NIP-17 related queries
      queryClient.invalidateQueries({ queryKey: ['nip17-messages'] });
      queryClient.invalidateQueries({ queryKey: ['nip17-conversations'] });
      queryClient.invalidateQueries({ queryKey: ['nip17-messages-between'] });
      queryClient.invalidateQueries({ queryKey: ['nip17-saved-messages'] });
      queryClient.invalidateQueries({ queryKey: ['nip17-saved-message-conversations'] });
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
      console.log('useNip17MessagesBetweenUsers: Starting query with params:', {
        otherUserPublicKey,
        publicKey,
        hasPrivateKey: !!privateKey,
        hasNdk: !!ndk,
        pageParam
      });

      if (!ndk || !publicKey || !privateKey || !otherUserPublicKey) {
        console.log('useNip17MessagesBetweenUsers: Missing required params');
        return { messages: [], nextCursor: undefined };
      }

      await checkIsConnected(ndk);

      const limit = options.limit || 50;

      // Fetch messages between the two users
      // For received messages, we need to fetch ALL messages where we are tagged as recipient
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

      // Also fetch any messages where we are tagged as recipient (in case we haven't sent any)
      const allReceivedEvents = await ndk.fetchEvents({
        kinds: [1059 as NDKKind],
        '#p': [publicKey], // We are tagged as recipient
        limit: limit,
        ...(pageParam && { until: pageParam as number }),
      });

      console.log('useNip17MessagesBetweenUsers: Fetched events:', {
        sentEventsCount: sentEvents.size,
        receivedEventsCount: receivedEvents.size,
        allReceivedEventsCount: allReceivedEvents.size
      });

      console.log('useNip17MessagesBetweenUsers: sentEvents:', Array.from(sentEvents));
      console.log('useNip17MessagesBetweenUsers: receivedEvents:', Array.from(receivedEvents));
      console.log('useNip17MessagesBetweenUsers: allReceivedEvents:', Array.from(allReceivedEvents));

      const allEvents = [...Array.from(sentEvents), ...Array.from(receivedEvents), ...Array.from(allReceivedEvents)];
      console.log('useNip17MessagesBetweenUsers: Total events:', allEvents.length);

      // Decrypt all events
      console.log('useNip17MessagesBetweenUsers: Attempting to decrypt', allEvents.length, 'events');
      const decryptedEvents = await Promise.all(
        allEvents.map(async (event) => {
          try {
            return await decryptGiftWrapContent(event, privateKey, publicKey);
          } catch (error) {
            console.error('useNip17MessagesBetweenUsers: Failed to decrypt event:', error);
            // Return a placeholder event for debugging
            return {
              ...event,
              decryptedContent: '[Failed to decrypt]',
              actualSenderPubkey: event.pubkey,
              actualReceiverPubkey: event.tags?.find(tag => tag[0] === 'p')?.[1],
            };
          }
        })
      );
      console.log('useNip17MessagesBetweenUsers: Decrypted events:', decryptedEvents);

      // Filter messages to only include those between the two specific users
      console.log('useNip17MessagesBetweenUsers: Filtering decrypted events...');
      const validMessages = decryptedEvents
        .filter(event => {
          if (!event) {
            console.log('useNip17MessagesBetweenUsers: Filtering out null event');
            return false;
          }
          
          // Check if this message is between the two users
          const actualSenderPubkey = event.actualSenderPubkey;
          const actualReceiverPubkey = event.actualReceiverPubkey;
          
          console.log('useNip17MessagesBetweenUsers: Checking event:', {
            actualSenderPubkey,
            actualReceiverPubkey,
            publicKey,
            otherUserPublicKey
          });
          
          // Message is between the two users if:
          // 1. We sent it to the other user, OR
          // 2. The other user sent it to us
          const isFromUsToThem = actualSenderPubkey === publicKey && actualReceiverPubkey === otherUserPublicKey;
          const isFromThemToUs = actualSenderPubkey === otherUserPublicKey && actualReceiverPubkey === publicKey;
          
          console.log("isFromUsToThem", isFromUsToThem);
          console.log("isFromThemToUs", isFromThemToUs);
          // Also check if this is a self-message (user talking to themselves)
          const isSelfMessage = actualSenderPubkey === actualReceiverPubkey && 
            (actualSenderPubkey === publicKey || actualSenderPubkey === otherUserPublicKey);
          
          const isSelfMessage2 = actualSenderPubkey === actualReceiverPubkey && actualSenderPubkey === publicKey;

          console.log("isSelfMessage", isSelfMessage);
          console.log("isSelfMessage2", isSelfMessage2);

          const isValid = isFromUsToThem || isFromThemToUs || isSelfMessage;
          // const isValid = isFromUsToThem || isFromThemToUs;
          console.log('useNip17MessagesBetweenUsers: Event valid:', isValid, { 
            isFromUsToThem, 
            isFromThemToUs, 
            isSelfMessage
          });
          
          return isValid;
        })
        .sort((a, b) => (a?.created_at || 0) - (b?.created_at || 0));

      console.log('useNip17MessagesBetweenUsers: Valid messages:', validMessages.length);

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

// Hook for saved messages (self-messages) - messages sent to yourself
export const useNip17SavedMessages = (options: UseNip17MessagesOptions = {}): UseInfiniteQueryResult<any, Error> => {
  const { ndk } = useNostrContext();
  const { publicKey, privateKey } = useAuth();

  return useInfiniteQuery({
    queryKey: ['nip17-saved-messages', options.limit, ndk],
    queryFn: async ({ pageParam = 0 }) => {
      if (!ndk || !publicKey || !privateKey) {
        return { messages: [], nextCursor: undefined };
      }

      await checkIsConnected(ndk);

      const limit = options.limit || 50;

      // Fetch messages where the user is both sender and receiver (self-messages)
      const selfMessages = await ndk.fetchEvents({
        kinds: [1059 as NDKKind],
        authors: [publicKey],
        '#p': [publicKey], // User is tagged as recipient
        limit: limit,
        ...(pageParam && { until: pageParam as number }),
      });

      console.log('useNip17SavedMessages: Fetched self-messages:', selfMessages.size);

      // Decrypt all events
      const decryptedEvents = await Promise.all(
        Array.from(selfMessages).map(async (event) => {
          try {
            return await decryptGiftWrapContent(event, privateKey, publicKey);
          } catch (error) {
            console.error('useNip17SavedMessages: Failed to decrypt event:', error);
            return {
              ...event,
              decryptedContent: '[Failed to decrypt]',
              actualSenderPubkey: event.pubkey,
              actualReceiverPubkey: event.tags?.find(tag => tag[0] === 'p')?.[1],
            };
          }
        })
      );

      // Filter to only include valid self-messages
      const validMessages = decryptedEvents
        .filter(event => {
          if (!event) return false;
          
          const actualSenderPubkey = event.actualSenderPubkey;
          const actualReceiverPubkey = event.actualReceiverPubkey;
          
          // Must be a self-message (sender and receiver are the same user)
          const isSelfMessage = actualSenderPubkey === publicKey && actualReceiverPubkey === publicKey;
          
          console.log('useNip17SavedMessages: Checking self-message:', {
            actualSenderPubkey,
            actualReceiverPubkey,
            publicKey,
            isSelfMessage
          });
          
          return isSelfMessage;
        })
        .sort((a, b) => (a?.created_at || 0) - (b?.created_at || 0));

      console.log('useNip17SavedMessages: Valid self-messages:', validMessages.length);

      const nextCursor = selfMessages.size === limit ? Array.from(selfMessages)[selfMessages.size - 1]?.created_at : undefined;

      return {
        messages: validMessages,
        nextCursor,
      };
    },
    enabled: options.enabled !== false && !!ndk && !!publicKey && !!privateKey,
    getNextPageParam: (lastPage: any) => lastPage.nextCursor,
    initialPageParam: 0,
  });
};

// Hook for sending saved messages (self-messages)
export const useSendNip17SavedMessage = () => {
  const { ndk } = useNostrContext();
  const { publicKey, privateKey } = useAuth();
  const { relays } = useSettingsStore();

  return useMutation({
    mutationKey: ['sendNip17SavedMessage', ndk],
    mutationFn: async (data: {
      message: string;
      relayUrl?: string;
      tags?: string[][];
    }) => {
      const { message, relayUrl, tags = [] } = data;

      await checkIsConnected(ndk);
      console.log('NIP-17 Saved Message: Sending self-message', {
        messageLength: message.length,
        hasPrivateKey: !!privateKey,
        hasPublicKey: !!publicKey
      });

      if (!privateKey || !publicKey) {
        throw new Error('Private key and public key are required for NIP-17 saved message');
      }

      if (!message) {
        throw new Error('Message content is required');
      }

      // Create NIP-17 message where sender and receiver are the same
      const result = await createNip17Message(
        ndk,
        privateKey,
        publicKey,
        publicKey, // Send to yourself
        message
      );

      console.log('NIP-17 Saved Message: Published events:', {
        receiverEventId: result.receiverGiftWrapEvent.id,
        senderEventId: result.senderGiftWrapEvent.id,
        pubkey: result.receiverGiftWrapEvent.pubkey,
        kind: result.receiverGiftWrapEvent.kind,
        contentLength: result.receiverGiftWrapEvent.content.length,
        tags: result.receiverGiftWrapEvent.tags,
      });

      return result;
    },
  });
};

// Hook for fetching saved message conversations (grouped by date or other criteria)
export const useNip17SavedMessageConversations = (options: UseNip17MessagesOptions = {}): UseInfiniteQueryResult<any, Error> => {
  const { ndk } = useNostrContext();
  const { publicKey, privateKey } = useAuth();

  return useInfiniteQuery({
    queryKey: ['nip17-saved-conversations', options.limit, ndk],
    queryFn: async ({ pageParam = 0 }) => {
      if (!ndk || !publicKey || !privateKey) {
        return { conversations: [], nextCursor: undefined };
      }

      await checkIsConnected(ndk);

      const limit = options.limit || 50;

      // Fetch all self-messages
      const selfMessages = await ndk.fetchEvents({
        kinds: [1059 as NDKKind],
        authors: [publicKey],
        '#p': [publicKey],
        limit: limit,
        ...(pageParam && { until: pageParam as number }),
      });

      // Decrypt all events
      const decryptedEvents = await Promise.all(
        Array.from(selfMessages).map(async (event) => {
          try {
            return await decryptGiftWrapContent(event, privateKey, publicKey);
          } catch (error) {
            console.error('useNip17SavedMessageConversations: Failed to decrypt event:', error);
            return null;
          }
        })
      );

      const validMessages = decryptedEvents.filter(event => event !== null);

      // Group messages by date (daily conversations)
      const conversationsMap = new Map<string, any>();
      
      validMessages.forEach(message => {
        const date = new Date(message.created_at * 1000);
        const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        if (!conversationsMap.has(dateKey)) {
          conversationsMap.set(dateKey, {
            date: dateKey,
            messages: [],
            messageCount: 0,
            lastMessageTime: message.created_at,
            lastMessageContent: message.decryptedContent,
          });
        }
        
        const conversation = conversationsMap.get(dateKey);
        conversation.messages.push(message);
        conversation.messageCount++;
        
        if (message.created_at > conversation.lastMessageTime) {
          conversation.lastMessageTime = message.created_at;
          conversation.lastMessageContent = message.decryptedContent;
        }
      });

      const conversations = Array.from(conversationsMap.values())
        .sort((a, b) => b.lastMessageTime - a.lastMessageTime);

      const nextCursor = selfMessages.size === limit ? Array.from(selfMessages)[selfMessages.size - 1]?.created_at : undefined;

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