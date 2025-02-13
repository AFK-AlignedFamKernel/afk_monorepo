import { NDKEvent, NDKKind, NDKTag, NDKUserProfile } from '@nostr-dev-kit/ndk';
import { useMutation } from '@tanstack/react-query';

// import {useNostrContext} from '../../context/NostrContext';
// import {useAuth} from '../../store/auth';
// import {useNostrContext} from '../context/NostrContext';
import { useNostrContext } from '../../context/NostrContext';
import { useAuth } from '../../store/auth';
export const useAddHashtagInterests = () => {
  const { ndk } = useNostrContext();
  const { publicKey } = useAuth();

  return useMutation({
    mutationKey: ['addHashtagInterests', ndk],
    // mutationFn: async (data?: NDKEvent, tags?: NDKTag[], isSetInterest?: boolean, isEncrypted?: boolean) => {
      mutationFn: async ({tags, isSetInterest, isEncrypted, isList}: {tags?: NDKTag[], isSetInterest?: boolean, isEncrypted?: boolean, isList?: boolean}) => {
      try {
        const user = ndk.getUser({ pubkey: publicKey });
        await user.fetchProfile();
        if (!user.profile) {
          throw new Error('Profile not found');
        }
        const event = new NDKEvent(ndk);

        // Look if the event is a set interest or a list interest
        // Set are multiple, List is only one item to update
        if (isSetInterest || !isList) {
          event.kind = NDKKind.InterestSet;
          event.tags = tags;
          console.log("event set interest",event);
          return event.publish();

        } else {

          const events = await ndk.fetchEvents({
            kinds: [NDKKind.InterestList],
            authors: [publicKey],
          });

          console.log("events list user",events);

          const interestList = [...events].filter((event) => event.kind === NDKKind.InterestList);

          const interestListTags = interestList.flatMap((event) => event.tags);

          const eventToUpdate = interestList.sort((a, b) => b.created_at - a.created_at)[0];
          // If there's an existing interest list event, update it instead of creating new
          if (interestList.length > 0) {
            // Get the most recent interest list event
            const latestInterestList = interestList.sort((a, b) => b.created_at - a.created_at)[0];

            // Update the existing event
            event.id = latestInterestList.id;
            event.created_at = Math.floor(Date.now() / 1000);

            // Merge existing tags with new tags, removing duplicates
            const existingTags = latestInterestList.tags;
            const mergedTags = [...existingTags, ...tags].filter((tag, index, self) =>
              index === self.findIndex((t) =>
                t[0] === tag[0] && t[1] === tag[1]
              )
            );

            event.tags = mergedTags;

            eventToUpdate.tags = mergedTags;

            eventToUpdate?.publish();
          } else {
            // If no existing list, create new event with provided tags
            event.created_at = Math.floor(Date.now() / 1000);
          }
          event.kind = NDKKind.InterestList;
          event.tags = tags;
        }
      } catch (error) {
        console.error('Error add hashtag interests', error);
        throw error;
      }
    },
  });
};
