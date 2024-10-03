import NDK, {NDKEvent, NDKKind} from '@nostr-dev-kit/ndk';
import {useQuery} from '@tanstack/react-query';

import {useNostrContext} from '../../../context/NostrContext';
import {useAuth} from '../../../store';
import {AdminGroupPermission} from './useAddPermissions';

type Permission = `${AdminGroupPermission}`;

type PermissionMeta = {
  ndk: NDK;
  pubkey: string;
  groupId: string;
};

type CheckPermissionMeta = PermissionMeta & {action: Permission};

/**
 * Util Fetch for hook permission check
 * @param param0
 * @returns
 */
export const fetchPermissions = async ({
  ndk,
  groupId,
  pubkey,
}: PermissionMeta): Promise<NDKEvent | null> => {
  const events = await ndk.fetchEvents({
    kinds: [9003 as number],
    '#h': [groupId],
    '#p': [pubkey],
    since: 0,
  });

  if (!events || events.size === 0) return null;

  const sortedEvents = [...events].sort((a, b) =>
    b.created_at && a.created_at ? b.created_at - a.created_at : 0,
  );

  // Return the latest event
  return sortedEvents[0];
};

/**
 * Util Fetch for hook permission check
 * @param param0
 * @returns
 */
export const checkGroupPermission = async ({ndk, groupId, pubkey, action}: CheckPermissionMeta) => {
  const event = await fetchPermissions({
    ndk,
    groupId,
    pubkey,
  });

  if (!event) {
    return false; // No admin event found for this user, so no permissions
  }

  // Find the tag for this specific user
  const userTag = event.tags.find((tag) => tag[0] === 'p' && tag[1] === pubkey);

  if (!userTag) {
    return false; // User not found in the admin event
  }

  // Get the user's permissions (all elements after the pubkey)
  const userPermissions = userTag.slice(2);

  // Check if the user has the required permission
  return userPermissions.includes(action);
};

/* *********************** */
/**
 * UI side Util Hook
 * @param groupId
 * @returns
 */
export const useGetGroupPermission = (groupId: string) => {
  const {ndk} = useNostrContext();
  const {publicKey} = useAuth();

  return useQuery({
    queryKey: ['getPermissionsByUserConnected', groupId],
    enabled: !!groupId,
    queryFn: async () => {
      const events = await ndk.fetchEvents({
        kinds: [9003 as NDKKind],
        '#h': [groupId],
        '#p': [publicKey],
      });

      if (!events || events.size === 0) return [];

      // Sort events by creation time (descending) to get the latest
      const sortedEvents = [...events].sort((a, b) =>
        b.created_at && a.created_at ? b.created_at - a.created_at : 0,
      );

      // Get the latest event
      const latestEvent = sortedEvents[0];

      // Find the tag for this specific user
      const userTag = latestEvent.tags.find((tag) => tag[0] === 'p' && tag[1] === publicKey);

      if (!userTag) return [];

      // Return the user's permissions (all elements after the pubkey)
      return userTag.slice(2);
    },
  });
};
