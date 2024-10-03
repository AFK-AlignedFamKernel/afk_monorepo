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

export const useIncomingMessageUsers = (options?: UseMyMessagesSentOptions) => {
  const {ndk} = useNostrContext();
  const {publicKey, privateKey} = useAuth();

  return useInfiniteQuery({
    queryKey: ['messageUsers', options?.authors],
    initialPageParam: 0,
    getNextPageParam: (lastPage: any, allPages, lastPageParam) => {
      if (!lastPage?.length) return undefined;
      const pageParam = lastPage[lastPage.length - 1].created_at - 1;
      if (!pageParam || pageParam === lastPageParam) return undefined;
      return pageParam;
    },
    queryFn: async ({pageParam}) => {
      const [incomingGiftWraps, outgoingGiftWraps] = await Promise.all([
        ndk.fetchEvents({
          kinds: [1059 as NDKKind],
          '#p': [publicKey],
          since: pageParam || undefined,
          limit: options?.limit || 20,
        }),
        ndk.fetchEvents({
          kinds: [1059 as NDKKind],
          authors: [publicKey],
          since: pageParam || undefined,
          limit: options?.limit || 20,
        }),
      ]);

      const decryptMessages = async (giftWraps: NDKEvent[]) => {
        return Promise.all(
          [...giftWraps].map(async (giftWrap: NDKEvent) => {
            try {
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

              const conversationKey = isSender
                ? deriveSharedKey(privateKey, fixPubKey(receiverPublicKey))
                : deriveSharedKey(privateKey, fixPubKey(senderPublicKey));

              const sealedEventJson = v2.decrypt(giftWrap.content, conversationKey);
              const sealedEvent = JSON.parse(sealedEventJson);

              if (sealedEvent.kind !== 13) {
                throw new Error('Invalid sealed event kind');
              }

              const originalMessageJson = v2.decrypt(sealedEvent.content, conversationKey);
              const originalMessage = JSON.parse(originalMessageJson);

              if (originalMessage.kind !== 14) {
                throw new Error('Invalid original message kind');
              }

              return {
                senderPublicKey,
                receiverPublicKey,
                senderName,
                receiverName,
                name: publicKey === senderPublicKey ? receiverName : senderName,
                created_at: giftWrap.created_at,
                id: giftWrap.id,
              };
            } catch (error) {
              console.error('Failed to decrypt message:', error);
              return null;
            }
          }),
        );
      };

      const [incomingMessages, outgoingMessages] = await Promise.all([
        decryptMessages(incomingGiftWraps as any),
        decryptMessages(outgoingGiftWraps as any),
      ]);

      const userMap = new Map();

      [...incomingMessages, ...outgoingMessages].forEach((message) => {
        if (message) {
          const otherUserPubkey =
            message.senderPublicKey === publicKey
              ? message.receiverPublicKey
              : message.senderPublicKey;
          const existingUser = userMap.get(otherUserPubkey);
          if (
            !existingUser ||
            (message?.created_at && message.created_at > existingUser.lastMessageAt)
          ) {
            userMap.set(otherUserPubkey, {
              id: message.id,
              pubkey: otherUserPubkey,
              name: message.name,
              senderName: message.senderName,
              receiverName: message.receiverName,
              lastMessageAt: message.created_at,
              senderPublicKey: message.senderPublicKey,
              receiverPublicKey: message.receiverPublicKey,
            });
          }
        }
      });

      const uniqueUsers = Array.from(userMap.values());
      uniqueUsers.sort((a, b) => b.lastMessageAt - a.lastMessageAt);

      return uniqueUsers;
    },
  });
};
