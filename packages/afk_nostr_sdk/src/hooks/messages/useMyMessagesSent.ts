import {useInfiniteQuery} from '@tanstack/react-query';
import { useNostrContext } from '../../context';
import { useAuth } from '../../store';

export type UseRootProfilesOptions = {
  authors?: string[];
  search?: string;
};

export const useMyMessagesSent = (options?: UseRootProfilesOptions) => {
  const {ndk} = useNostrContext();
  const {publicKey} = useAuth()
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
