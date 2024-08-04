import {NDKEvent, NDKKind} from '@nostr-dev-kit/ndk';
import {useMutation} from '@tanstack/react-query';

import {useNostrContext} from '../../../context/NostrContext';
import {useAuth} from '../../../store/auth';

export const useCreateChannel = () => {
  const {ndk} = useNostrContext();
  const {publicKey} = useAuth();

  return useMutation({
    mutationKey: ['createChannel', ndk],
    mutationFn: async (data: {content: string; channel_name: string; tags?: string[][]}) => {
      try {
        const user = ndk.getUser({pubkey: publicKey});

        // if (!user.profile) {
        //   throw new Error('Profile not found');
        // }
        const event = new NDKEvent(ndk);
        event.kind = NDKKind.ChannelCreation;
        event.content = data.content;
        event.author = user;
        event.tags = data.tags ?? [];
        await event.publish();

        return event;
      } catch (error) {
        console.error('Error create channel', error);
        throw error;
      }
    },
  });
};
