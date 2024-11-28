import {NDKEvent} from '@nostr-dev-kit/ndk';
import {useMutation, useQueryClient} from '@tanstack/react-query';

import {useNostrContext} from '../../context';
import {useAuth} from '../../store';

interface DeleteTokenEventParams {
  eventId: string;
  reason?: string;
}

/**
 * Hook for deleting token events according to NIP-09
 * When proofs are spent, we create a deletion event referencing the original token event
 */
export const useDeleteTokenEvent = () => {
  const {ndk} = useNostrContext();
  const {publicKey, privateKey} = useAuth();
  const queryClient = useQueryClient();

  return useMutation<NDKEvent, Error, DeleteTokenEventParams>({
    mutationFn: async ({eventId, reason = 'proofs spent'}) => {
      if (!ndk || !privateKey) {
        throw new Error('NDK or private key not initialized');
      }

      // Create a new deletion event
      const deletionEvent = new NDKEvent(ndk);

      // Set the kind to 5 (deletion)
      deletionEvent.kind = 5; // NDKKind.Deletion

      // Set the content to the reason for deletion
      deletionEvent.content = reason;

      // Add the event reference tag
      deletionEvent.tags = [
        ['e', eventId], // Reference to the event being deleted
      ];
      deletionEvent.pubkey = publicKey;

      // Sign and publish the deletion event
      await deletionEvent.sign();
      await deletionEvent.publish();

      return deletionEvent;
    },
    onSuccess: () => {
      // Invalidate relevant queries to trigger a refetch
      queryClient.invalidateQueries({queryKey: ['getCashuTokens']});
    },
    onError: (error) => {
      console.error('Failed to delete token event:', error);
      throw error;
    },
  });
};

// Helper hook to handle the deletion of multiple token events
export const useDeleteTokenEvents = () => {
  const deleteTokenEvent = useDeleteTokenEvent();

  const deleteMultipleEvents = async (eventIds: string[], reason?: string) => {
    try {
      const results = await Promise.all(
        eventIds.map((eventId) => deleteTokenEvent.mutateAsync({eventId, reason})),
      );
      return results;
    } catch (error) {
      console.error('Failed to delete multiple token events:', error);
      throw error;
    }
  };

  return {
    ...deleteTokenEvent,
    deleteMultiple: deleteMultipleEvents,
  };
};
