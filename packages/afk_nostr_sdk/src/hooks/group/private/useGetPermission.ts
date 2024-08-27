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

export const useGetPermissionsByUserConnected = (groupId: string) => {
  const {ndk} = useNostrContext();
  const {publicKey} = useAuth();
  return useQuery({
    queryKey: ['getPermissionsByUserConnected', groupId],
    queryFn: () =>
      fetchPermissions({
        ndk,
        groupId,
        pubkey: publicKey,
      }),
  });
};

// Function for fetching permissions
const fetchPermissions = async ({
  ndk,
  groupId,
  pubkey,
}: PermissionMeta): Promise<NDKEvent | null> => {
  const events = await ndk.fetchEvent({
    kinds: [NDKKind.GroupAdmins],
    '#d': [groupId],
    '#p': [pubkey],
    limit: 1,
  });

  return events ?? null;
};

// Function for checking permissions
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

  // Get the user's permissions (all elements after the label)
  const userPermissions = userTag.length > 3 ? userTag.slice(3) : [];

  // Check if the user has the required permission
  return userPermissions.includes(action);
};
