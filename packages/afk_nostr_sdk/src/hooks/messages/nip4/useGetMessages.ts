import NDK, {NDKEvent, NDKKind, NDKPrivateKeySigner} from '@nostr-dev-kit/ndk';
import {InfiniteData, useInfiniteQuery, UseInfiniteQueryResult} from '@tanstack/react-query';

import {useNostrContext} from '../../../context/NostrContext';
import {useAuth, useSettingsStore} from '../../../store';
import {deriveSharedKey, generateRandomBytes, generateRandomKeypair} from '../../../utils/keypair';
/** NIP-4 Encrypted message: https://nips.nostr.com/4
 * Deprecated
 * Fix private message and user a relay that's enable it
 *
 */

interface UseMyMessagesSentOptions {
  authors?: string[];
  limit?: number;
  search?: string;
}

export const fetchMessagesSent = async (ndk: NDK, publicKey: string, pageParam: number, limit: number): Promise<NDKEvent[]> => {
  console.log("fetchMessagesSent", ndk, publicKey, pageParam, limit);
  const directMessagesSent = await ndk.fetchEvents({
    kinds: [NDKKind.EncryptedDirectMessage],
    authors: [publicKey],
    since: pageParam || undefined,
    limit: limit || 30,
  });
  console.log("directMessagesSent", directMessagesSent);
  return Array.from(directMessagesSent);
};

export const fetchMessagesReceived = async (ndk: NDK, publicKey: string, pageParam: number, limit: number): Promise<NDKEvent[]> => {

  const directMessagesReceived = await ndk.fetchEvents({
    kinds: [NDKKind.EncryptedDirectMessage],
    '#p': [publicKey],
    since: pageParam || undefined,
    limit: limit || 30,
  });

  console.log("directMessagesReceived", directMessagesReceived);
  return Array.from(directMessagesReceived);
};

export const useGetAllMessages = (options?: UseMyMessagesSentOptions):UseInfiniteQueryResult<InfiniteData<any, any>, Error> => {
  const {ndk} = useNostrContext();
  const {publicKey, privateKey} = useAuth();
  
  return useInfiniteQuery({
    queryKey: ['messageNip4All', options?.authors],
    // queryKey: ['messageUsers', options?.authors, publicKey],
    initialPageParam: 0,
    // enabled: !!publicKey,
    getNextPageParam: (lastPage: any, allPages, lastPageParam) => {
      if (!lastPage?.length) return undefined;
      const pageParam = lastPage[lastPage.length - 1].created_at - 1;
      if (!pageParam || pageParam === lastPageParam) return undefined;
      return pageParam;
    },
    queryFn: async ({pageParam}) => {

      console.log("queryFn");
      const connectedRelays = ndk.pool.connectedRelays();
      console.log("connectedRelays", connectedRelays);

      if (connectedRelays.length === 0) {
        console.log("no connected relays");
        await ndk.connect();
        console.log("connected relays", ndk.pool.connectedRelays());
      }
      
      const directMessagesAll = await Promise.all([
        fetchMessagesSent(ndk, publicKey, pageParam, options?.limit || 30),
        fetchMessagesReceived(ndk, publicKey, pageParam, options?.limit || 30),
      ]);

      console.log("directMessagesAll", directMessagesAll);
      const allMessages = [...directMessagesAll[0], ...directMessagesAll[1]];
      allMessages.sort((a, b) => b.created_at - a.created_at);
      return allMessages;
    },
  });
  
};  

export const useGetMessagesSent = (options?: UseMyMessagesSentOptions):UseInfiniteQueryResult<InfiniteData<any, any>, Error> => {
  const {ndk} = useNostrContext();
  const {publicKey, privateKey} = useAuth();

  return useInfiniteQuery({
    queryKey: ['messageNip4Sent', options?.authors],
    // queryKey: ['messageUsers', options?.authors, publicKey],
    initialPageParam: 0,
    // enabled: !!publicKey,
    getNextPageParam: (lastPage: any, allPages, lastPageParam) => {
      if (!lastPage?.length) return undefined;
      const pageParam = lastPage[lastPage.length - 1].created_at - 1;
      if (!pageParam || pageParam === lastPageParam) return undefined;
      return pageParam;
    },
    queryFn: async ({pageParam}) => {
      const directMessagesSent = await ndk.fetchEvents({
          kinds: [NDKKind.EncryptedDirectMessage],
          authors: [publicKey],
          // until: pageParam + 1 || undefined,
          limit: options?.limit || 30,
        });

      return directMessagesSent;
    },
  });
};

export const useGetMessagesReceived = (options?: UseMyMessagesSentOptions):UseInfiniteQueryResult<InfiniteData<any, any>, Error> => {
  const {ndk} = useNostrContext();
  const {publicKey, privateKey} = useAuth();

  return useInfiniteQuery({
    queryKey: ['messageNip4Received', options?.authors],
    // queryKey: ['messageUsers', options?.authors, publicKey],
    initialPageParam: 0,
    // enabled: !!publicKey,
    getNextPageParam: (lastPage: any, allPages, lastPageParam) => {
      if (!lastPage?.length) return undefined;
      const pageParam = lastPage[lastPage.length - 1].created_at - 1;
      if (!pageParam || pageParam === lastPageParam) return undefined;
      return pageParam;
    },
    queryFn: async ({pageParam}) => {
      const directMessagesReceived = await ndk.fetchEvents({
          kinds: [NDKKind.EncryptedDirectMessage],
          '#p': [publicKey],
          since: pageParam || undefined,
          // until: pageParam + 1 || undefined,
          limit: options?.limit || 20,
        });

      return directMessagesReceived;
    },
  });
};