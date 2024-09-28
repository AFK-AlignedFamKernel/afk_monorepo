import {NDKEvent, NDKKind} from '@nostr-dev-kit/ndk';
import {useMutation} from '@tanstack/react-query';

import {useNostrContext} from '../../../context/NostrContext';
import {useAuth} from '../../../store';

/**
 * Access means if a group is PRIVATE OR PUBLIC
 * View means if a group is OPEN OR CLOSE.
 */
enum GroupEnum {
  GROUP_ACCESS = 'access',
  GROUP_VIEW = 'view',
}
// TODO
export const useCreateGroup = () => {
  const {ndk} = useNostrContext();
  const {publicKey} = useAuth();

  return useMutation({
    mutationKey: ['createGroup', ndk],
    mutationFn: async (data?: {groupType: 'private' | 'public'; groupName: string}) => {
      const event = new NDKEvent(ndk);
      event.kind = NDKKind.GroupAdminCreateGroup;
      event.content = data?.groupName ?? '';
      event.tags = [
        [GroupEnum.GROUP_ACCESS, data?.groupType ?? 'private'],
        [GroupEnum.GROUP_VIEW, 'open'],
        ['name', data?.groupName ?? ''],
        ['p', publicKey],
      ];

      event.publish();
      return event;
    },
  });
};
