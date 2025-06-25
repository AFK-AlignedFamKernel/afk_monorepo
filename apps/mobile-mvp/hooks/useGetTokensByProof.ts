import {Proof} from '@cashu/cashu-ts';
import {useQueryClient} from '@tanstack/react-query';
import {useGetCashuTokenEvents} from 'afk_nostr_sdk';

export const useGetTokensByProofs = (proofs: Proof[]) => {
  const queryClient = useQueryClient();
  const proofIds = proofs.map((proof) => proof.id);

  const {
    data: tokenEventsData,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = useGetCashuTokenEvents({
    proofIds,
  });

  // Flatten pages into a single array of events
  const events = tokenEventsData?.pages.flat() ?? [];

  // Create a refetch function that resets and refetches
  const refetchTokens = async () => {
    // Reset the query cache for this specific query
    await queryClient.resetQueries({queryKey: ['getCashuTokens', proofIds]});
    // Refetch the data
    return refetch();
  };

  return {
    events,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    refetch: refetchTokens,
  };
};
