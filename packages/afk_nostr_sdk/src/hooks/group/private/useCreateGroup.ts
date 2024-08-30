import {NDKEvent, NDKKind} from '@nostr-dev-kit/ndk';
import {useMutation} from '@tanstack/react-query';

import {useNostrContext} from '../../../context/NostrContext';

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

  return useMutation({
    mutationKey: ['createGroup', ndk],
    mutationFn: async (data?: {groupType: 'private' | 'public'; groupName: string}) => {
      const event = new NDKEvent(ndk);
      event.kind = NDKKind.GroupAdminCreateGroup;
      event.content = data.groupName;
      event.tags = [
        [GroupEnum.GROUP_ACCESS, data.groupType],
        [GroupEnum.GROUP_VIEW, 'open'],
        ['name', data.groupName],
      ];
      return event.publish();
    },
  });
};
