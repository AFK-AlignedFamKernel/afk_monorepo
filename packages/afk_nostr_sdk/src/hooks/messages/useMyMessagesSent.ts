import {NDKEvent, NDKKind} from '@nostr-dev-kit/ndk';
import {useInfiniteQuery} from '@tanstack/react-query';

import {useNostrContext} from '../../context';
import {useAuth} from '../../store';
import {deriveSharedKey, fixPubKey} from '../../utils/keypair';
import {v2} from '../../utils/nip44';

interface UseMyMessagesSentOptions {
  authors?: string[];
  limit?: number;
  search?: string;
}
interface DecryptedMessage {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  decryptedContent: string;
}

interface DecryptedMessage {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  decryptedContent: string;
}

export const useMyMessagesSent = (options?: UseMyMessagesSentOptions) => {
  const {ndk} = useNostrContext();
  const {publicKey} = useAuth();
  return useInfiniteQuery({
    initialPageParam: 0,
    queryKey: ['myMessagesSent', options?.authors, options?.search, ndk],
    getNextPageParam: (lastPage: any, allPages, lastPageParam) => {
      if (!lastPage?.length) return undefined;

      const pageParam = lastPage[lastPage.length - 1].created_at - 1;

      if (!pageParam || pageParam === lastPageParam) return undefined;
      return pageParam;
    },
    queryFn: async ({pageParam}) => {
      const giftsWrap = await ndk.fetchEvents({
        kinds: [1059 as number],
        authors: options?.authors,
        search: options?.search,
        // until: pageParam || Math.round(Date.now() / 1000),
        limit: 20,
      });

      return [...giftsWrap];
    },
    placeholderData: {pages: [], pageParams: []},
  });
};

interface UseRoomMessageOptions {
  authors?: string[];
  limit?: number;
  roomParticipants: string[];
}

export const useRoomMessages = (options?: UseRoomMessageOptions) => {
  const {ndk} = useNostrContext();
  const {publicKey, privateKey} = useAuth(); // User's public and private keys

  return useInfiniteQuery({
    queryKey: ['messagesSent', options?.authors],
    initialPageParam: 0,
    getNextPageParam: (lastPage: DecryptedMessage[], allPages, lastPageParam) => {
      if (!lastPage?.length) return undefined;
      const pageParam = lastPage[lastPage.length - 1].created_at - 1;
      if (!pageParam || pageParam === lastPageParam) return undefined;
      return pageParam;
    },
    queryFn: async ({pageParam}) => {
      const giftWraps = await ndk.fetchEvents({
        kinds: [1059 as NDKKind],
        authors: options?.roomParticipants,
        since: pageParam ? pageParam : undefined,
        limit: options?.limit || 20,
      });

      // @ts-ignore
      const decryptedMessages: DecryptedMessage[] = await Promise.all(
        [...giftWraps].map(async (giftWrap: NDKEvent) => {
          try {
            //--> Get receiver's public key from tags (recipient)
            const receiverPublicKey = giftWrap.tags.find((tag) => tag[0] === 'p')?.[1];
            const senderName = giftWrap.tags.find((tag) => tag[0] === 'sender')?.[2];
            const receiverName = giftWrap.tags.find((tag) => tag[0] === 'receiverName')?.[1];
            const senderPublicKey = giftWrap.pubkey;
            if (!receiverPublicKey) throw new Error('Receiver public key not found');

            const isSender = publicKey === senderPublicKey;
            const isRecipient = publicKey === receiverPublicKey;

            if (!isSender && !isRecipient) {
              throw new Error('User is neither sender nor recipient');
            }

            //--> Derive the shared secret based on who the current user is
            const conversationKey = isSender
              ? deriveSharedKey(privateKey, fixPubKey(receiverPublicKey)) // Sender's private key, recipient's public key
              : deriveSharedKey(privateKey, fixPubKey(senderPublicKey)); // Recipient's private key, sender's public key

            //--> Decrypt gift wrap content to get the sealed event
            const sealedEventJson = v2.decrypt(giftWrap.content, conversationKey);
            const sealedEvent = JSON.parse(sealedEventJson);

            //--> Verify the sealed event is valid (kind 13)
            if (sealedEvent.kind !== 13) {
              throw new Error('Invalid sealed event kind');
            }

            //--> Decrypt the sealed event content to get the original message
            const originalMessageJson = v2.decrypt(sealedEvent.content, conversationKey);
            const originalMessage = JSON.parse(originalMessageJson);

            //--> Verify the original message is valid (kind 14)
            if (originalMessage.kind !== 14) {
              throw new Error('Invalid original message kind');
            }

            //--> Return the decrypted message
            return {
              id: giftWrap.id,
              pubkey: senderPublicKey, // Use the sender's public key
              created_at: giftWrap.created_at,
              kind: giftWrap.kind,
              tags: giftWrap.tags,
              content: giftWrap.content,
              decryptedContent: originalMessage.content,
              senderName,
              receiverName,
              senderPublicKey,
              receiverPublicKey,
            };
          } catch (error) {
            console.error('Failed to decrypt message:', error);
            return null; // Return null for failed decryptions
          }
        }),
      );

      // Filter out null values (failed decryptions)
      return decryptedMessages.filter((message): message is DecryptedMessage => message !== null);
    },
  });
};
