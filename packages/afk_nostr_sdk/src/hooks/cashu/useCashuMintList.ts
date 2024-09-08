
import { useInfiniteQuery, useMutation } from '@tanstack/react-query';
import { useNostrContext } from '../../context';
import NDK, { NDKEvent, NDKKind, NDKPrivateKeySigner } from '@nostr-dev-kit/ndk';

export type UseCashuMintList = {
  authors?: string[];
  search?: string;
};

/** Cashu Mint List
 */
export const useCashuMintList = (options?: UseCashuMintList) => {
  const { ndk } = useNostrContext()

  return useInfiniteQuery({
    initialPageParam: 0,
    queryKey: ['cashuMintList', options?.authors, options?.search, ndk],
    getNextPageParam: (lastPage: any, allPages, lastPageParam) => {
      if (!lastPage?.length) return undefined;

      const pageParam = lastPage[lastPage.length - 1].created_at - 1;

      if (!pageParam || pageParam === lastPageParam) return undefined;
      return pageParam;
    },
    queryFn: async ({pageParam}) => {
      const mintList = await ndk.fetchEvents({
        kinds: [NDKKind.CashuMintList],
        authors: options?.authors,
        search: options?.search,
        // until: pageParam || Math.round(Date.now() / 1000),
        limit: 20,
      });

      return [...mintList];
    },
    placeholderData: {pages: [], pageParams: []},
  });
}
