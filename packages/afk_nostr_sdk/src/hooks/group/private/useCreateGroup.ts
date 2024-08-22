import {useMutation} from '@tanstack/react-query';
import {useNostrContext} from '../../../context/NostrContext';
import {useAuth} from '../../../store';
import {NDKEvent, NDKKind} from '@nostr-dev-kit/ndk';

export type UseCreateGroupOptions = {
  authors?: string[];
  search?: string;
};

// TODO
export const useCreateGroup = (options?: UseCreateGroupOptions) => {
  const {ndk} = useNostrContext();

  return useMutation({
    mutationKey: ['createGroup', ndk],
    mutationFn: async (data?: {groupType: 'private' | 'public'}) => {
      const event = new NDKEvent(ndk);
      event.kind = NDKKind.GroupAdminCreateGroup;
      event.tags = [[data.groupType || 'private']];
      return event.publish();
    },
  });
};
