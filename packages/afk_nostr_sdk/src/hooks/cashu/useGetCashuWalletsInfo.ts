import {NDKKind} from '@nostr-dev-kit/ndk';
import {useInfiniteQuery} from '@tanstack/react-query';

import {useNostrContext} from '../../context';
import {useAuth} from '../../store';

/**
 * NIP-60: https://nips.nostr.com/60
 * Wallet Event: https://nips.nostr.com/60#wallet-event
 */

export type UseRootProfilesOptions = {
  authors?: string[];
  search?: string;
};

export const useGetCashuWalletsInfo = (options?: UseRootProfilesOptions) => {
  const {ndk} = useNostrContext();
  const {publicKey} = useAuth();
  return useInfiniteQuery({
    initialPageParam: 0,
    queryKey: ['getCashuWallets', options?.authors, options?.search, ndk],
    getNextPageParam: (lastPage: any, allPages, lastPageParam) => {
      if (!lastPage?.length) return undefined;

      const pageParam = lastPage[lastPage.length - 1].created_at - 1;

      if (!pageParam || pageParam === lastPageParam) return undefined;
      return pageParam;
    },
    queryFn: async ({pageParam}) => {
      const cashuWallets = await ndk.fetchEvents({
        kinds: [NDKKind.CashuWallet],
        authors: options?.authors || [publicKey],
        search: options?.search,
        until: pageParam || Math.round(Date.now() / 1000),
        limit: 20,
      });

      console.log('cashuWallets', cashuWallets);
      console.log('[...cashuWallets]', [...cashuWallets]);
      return [cashuWallets];
    },
    placeholderData: {pages: [], pageParams: []},
  });
};
