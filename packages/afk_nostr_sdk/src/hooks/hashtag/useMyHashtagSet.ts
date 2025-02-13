import { NDKEvent, NDKKind, NDKTag, NDKUserProfile } from '@nostr-dev-kit/ndk';
import { useMutation } from '@tanstack/react-query';

// import {useNostrContext} from '../../context/NostrContext';
// import {useAuth} from '../../store/auth';
// import {useNostrContext} from '../context/NostrContext';
import { useNostrContext } from '../../context/NostrContext';
import { useAuth } from '../../store/auth';
export const useMyHashtagSet = () => {
  const { ndk } = useNostrContext();
  const { publicKey } = useAuth();

  return useMutation({
    mutationKey: ['getMyHashtagSet', ndk],
    // mutationFn: async (data?: NDKEvent, tags?: NDKTag[], isSetInterest?: boolean, isEncrypted?: boolean) => {
    mutationFn: async ({ tags }: { tags?: NDKTag[], }) => {
      try {
        const events = await ndk.fetchEvents({
          kinds: [NDKKind.InterestSet],
          authors: [publicKey],
        });

        console.log("events set interest", events);
        return [...events].filter((event) => event.kind === NDKKind.InterestSet);
      } catch (error) {
        console.error('Error get hashtag set', error);
        throw error;
      }
    },
  });
};
