import {useAuth} from '../../store';
import {useInfiniteQuery, useMutation} from '@tanstack/react-query';
import {useNostrContext} from '../../context';
import NDK, {NDKEvent, NDKKind, NDKPrivateKeySigner} from '@nostr-dev-kit/ndk';

/**https://github.com/nostr-protocol/nips/blob/9f9ab83ee9809251d0466f22c188a0f13abd585a/60.md 
/** 
 * https://github.com/nostr-protocol/nips/pull/1369/files */

/**
 * 
 * @returns {
    "kind": 37375,
    "content": nip44_encrypt([
        [ "balance", "100", "sat" ],
        [ "privkey", "hexkey" ] // explained in NIP-61
    ]),
    "tags": [
        [ "d", "my-wallet" ],
        [ "mint", "https://mint1" ],
        [ "mint", "https://mint2" ],
        [ "mint", "https://mint3" ],
        [ "name", "my shitposting wallet" ],
        [ "unit", "sat" ],
        [ "description", "a wallet for my day-to-day shitposting" ],
        [ "relay", "wss://relay1" ],
        [ "relay", "wss://relay2" ],
    ]
}
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
        authors: options?.authors,
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
