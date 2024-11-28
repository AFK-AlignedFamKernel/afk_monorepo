import {NDKEvent, NDKKind, NDKPrivateKeySigner, NDKUser} from '@nostr-dev-kit/ndk';
import {useInfiniteQuery} from '@tanstack/react-query';

import {useNostrContext} from '../../context';
import {useAuth} from '../../store';

export interface UseTokenEventsOptions {
  authors?: string[];
  walletId?: string;
  search?: string;
  proofIds?: string[];
}

interface TokenEventContent {
  mint: string;
  proofs: Array<{
    id: string;
    amount: number;
    secret: string;
    C: string;
  }>;
}

export const useGetCashuTokenEvents = (options?: UseTokenEventsOptions) => {
  const {ndk} = useNostrContext();
  const {publicKey, privateKey} = useAuth();

  return useInfiniteQuery({
    initialPageParam: 0,
    queryKey: [
      'getCashuTokens',
      options?.authors,
      options?.walletId,
      options?.search,
      options?.proofIds,
      ndk,
    ],
    getNextPageParam: (lastPage: NDKEvent[], allPages, lastPageParam) => {
      if (!lastPage?.length) return undefined;

      const pageParam = lastPage[lastPage.length - 1].created_at - 1;

      if (!pageParam || pageParam === lastPageParam) return undefined;
      return pageParam;
    },
    queryFn: async ({pageParam}) => {
      const filter: {
        kinds: number[];
        authors?: string[];
        '#a'?: string[];
        search?: string;
        until?: number;
        limit: number;
      } = {
        kinds: [NDKKind.CashuToken],
        authors: options?.authors || [publicKey],
        limit: 20,
        until: pageParam || Math.round(Date.now() / 1000),
      };

      // Add wallet ID filter if provided
      if (options?.walletId) {
        filter['#a'] = [`37375:${publicKey}:${options.walletId}`];
      }

      // Add search if provided
      if (options?.search) {
        filter.search = options.search;
      }

      const tokenEvents = await ndk.fetchEvents(filter);

      // If no proof IDs to filter by, return all events
      if (!options?.proofIds?.length) {
        return [...tokenEvents];
      }

      // Filter events by proof IDs
      const signer = new NDKPrivateKeySigner(privateKey);
      const user = new NDKUser({pubkey: publicKey});

      const filteredEvents = await Promise.all(
        [...tokenEvents].map(async (event) => {
          try {
            // Decrypt the event content
            const decryptedContent = await signer.nip44Decrypt(user, event.content);

            const content: TokenEventContent = JSON.parse(decryptedContent);

            // Check if any of the proofs match the filter
            const hasMatchingProof = content.proofs.some((proof) =>
              options.proofIds?.includes(proof.id),
            );

            return hasMatchingProof ? event : null;
          } catch (error) {
            console.error('Error decrypting event:', error);
            return null;
          }
        }),
      );

      // Remove null values and return filtered events
      return filteredEvents.filter((event): event is NDKEvent => event !== null);
    },
    placeholderData: {pages: [], pageParams: []},
  });
};
