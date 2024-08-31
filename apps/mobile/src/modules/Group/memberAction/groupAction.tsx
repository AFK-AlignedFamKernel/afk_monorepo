import {useQueryClient} from '@tanstack/react-query';
import {
  AdminGroupPermission,
  useAddPermissions,
  useGetGroupPermission,
  useRemoveMember,
} from 'afk_nostr_sdk';
import React, {useState} from 'react';
import {ScrollView, Switch, Text, TouchableOpacity, View} from 'react-native';

import {CrownIcon, RemoveIcon} from '../../../assets/icons';
import {useStyles} from '../../../hooks';
import {useToast} from '../../../hooks/modals';
import stylesheet from './styles';

export enum AdminGroupPermissionForm {
  AddMember = 'add-user',
  EditMetadata = 'edit-metadata',
  DeleteEvent = 'delete-event',
  RemoveUser = 'remove-user',
  AddPermission = 'add-permission',
  RemovePermission = 'remove-permission',
  EditGroupStatus = 'edit-group-status',
  DeleteGroup = 'delete-group',
  ViewAccess = 'ViewAccess',
}

const GroupAdminActions = ({
  selectedMember,
  handleClose,
  groupId,
}: {
  selectedMember: any;
  handleClose: () => void;
  groupId: string;
}) => {
  const {data: permissionData} = useGetGroupPermission(groupId);
  const {mutate: removeMember} = useRemoveMember();
  const {mutate: addPermissions} = useAddPermissions();
  const queryClient = useQueryClient();
  const {showToast} = useToast();
  const styles = useStyles(stylesheet);
  const {mutate: addPermission} = useAddPermissions();
  const [permissions, setPermissions] = useState({
    [AdminGroupPermissionForm.AddMember]: false,
    [AdminGroupPermissionForm.EditMetadata]: false,
    [AdminGroupPermissionForm.DeleteEvent]: false,
    [AdminGroupPermissionForm.RemoveUser]: false,
    [AdminGroupPermissionForm.AddPermission]: false,
    [AdminGroupPermissionForm.RemovePermission]: false,
    [AdminGroupPermissionForm.EditGroupStatus]: false,
    [AdminGroupPermissionForm.DeleteGroup]: false,
  });

  const memberPubKey = selectedMember?.tags.find((tag: any) => tag[0] === 'p')?.[1];

  const togglePermission = (permission: AdminGroupPermissionForm) => {
    setPermissions((prev: any) => ({
      ...prev,
      [permission]: !prev[permission],
    }));
  };

  const handleMakeAdmin = () => {
    const activePermissions = Object.entries(permissions)
      .filter(([_, value]) => value)
      .map(([key]) => key);

    activePermissions.push(AdminGroupPermission.ViewAccess);
    addPermissions(
      {
        groupId,
        pubkey: memberPubKey,
        permissionName: activePermissions as any,
      },
      {
        onSuccess: () => {
          showToast({type: 'success', title: 'Permissions updated successfully'});
          queryClient.invalidateQueries({queryKey: ['getAllGroupMember']});
          queryClient.invalidateQueries({
            queryKey: ['getPermissionsByUserConnected', groupId],
          });

          handleClose();
        },
        onError: () => {
          showToast({
            type: 'error',
            title: 'Error! Permissions could not be updated. Please try again later.',
          });
        },
      },
    );
  };

  const handleRemoveMember = () => {
    removeMember(
      {
        groupId,
        pubkey: memberPubKey,
        permissionData: permissionData as any,
      },
      {
        onSuccess: () => {
          // After removing external member by pubkey, remove their access.
          addPermission(
            {
              groupId,
              pubkey: memberPubKey,
              permissionName: [],
            },
            {
              onSuccess() {
                showToast({type: 'success', title: 'Member removed successfully'});
                queryClient.invalidateQueries({queryKey: ['getAllGroupMember']});
                queryClient.invalidateQueries({
                  queryKey: ['getPermissionsByUserConnected', groupId],
                });
                handleClose();
              },
              onError() {
                showToast({
                  type: 'error',
                  title: 'Error! Member could not be removed. Please try again later.',
                });
                handleClose();
              },
            },
          );
        },
        onError: () => {
          showToast({
            type: 'error',
            title: 'Error! Member could not be removed. Please try again later.',
          });
        },
      },
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <CrownIcon width={24} stroke="#4a90e2" height={24} />
          <Text style={styles.cardTitle}>Admin Permissions</Text>
        </View>

        <>
          {permissionData && permissionData.includes(AdminGroupPermission.AddPermission) && (
            <>
              {Object.entries(permissions).map(([permission, value]) => (
                <View key={permission} style={styles.permissionItem}>
                  <Text style={styles.permissionText}>{permission}</Text>
                  <Switch
                    value={value}
                    onValueChange={() => togglePermission(permission as AdminGroupPermissionForm)}
                    trackColor={{
                      false: styles.switchTrack.backgroundColor,
                      true: styles.switchTrackActive.backgroundColor,
                    }}
                    thumbColor={
                      value
                        ? styles.switchThumbActive.backgroundColor
                        : styles.switchThumb.backgroundColor
                    }
                  />
                </View>
              ))}
              <TouchableOpacity onPress={handleMakeAdmin} style={styles.actionButton}>
                <Text style={styles.actionButtonText}>Update Permissions</Text>
              </TouchableOpacity>
            </>
          )}
        </>
      </View>

      {permissionData && permissionData.includes(AdminGroupPermission.RemoveUser) && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <RemoveIcon stroke="red" />
            <Text style={styles.cardTitle}>Remove from Group</Text>
          </View>
          <TouchableOpacity
            onPress={handleRemoveMember}
            style={[styles.actionButton, styles.removeButton]}
          >
            <Text style={styles.actionButtonText}>Remove</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

export default GroupAdminActions;
