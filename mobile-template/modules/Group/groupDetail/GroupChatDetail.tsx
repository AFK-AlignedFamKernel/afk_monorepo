import {useQueryClient} from '@tanstack/react-query';
import {
  AdminGroupPermission,
  useAuth,
  useDeleteGroup,
  useGetGroupMemberList,
  useGetGroupMetadata,
  useGetGroupPermission,
} from 'afk_nostr_sdk';
import React, {useRef, useState} from 'react';
import {FlatList, Pressable, SafeAreaView, TouchableOpacity, View} from 'react-native';

import {AddPostIcon, BackIcon, EditIcon, TrashIcon, UserPlusIcon} from '../../../assets/icons';
import {IconButton, Modalize, Text} from '../../../components';
import {useStyles, useTheme} from '../../../hooks';
import {useToast} from '../../../hooks/modals';
import {GroupChatDetailScreenProps} from '../../../types';
import AddMemberView from '../memberAction/addMember';
import {EditGroup} from '../memberAction/editGroup';
import GroupAdminActions from '../memberAction/groupAction';
import stylesheet from './styles';

const GroupChatDetail: React.FC<GroupChatDetailScreenProps> = ({navigation, route}) => {
  const theme = useTheme();
  const {publicKey: pubKey} = useAuth();
  const queryClient = useQueryClient();
  const {showToast} = useToast();
  const {data: permissionData} = useGetGroupPermission(route.params.groupId);
  const {data: groupMetaData} = useGetGroupMetadata({groupId: route.params.groupId, pubKey});
  const memberListData = useGetGroupMemberList({
    groupId: route.params.groupId,
  });

  const {mutate} = useDeleteGroup();
  const modalizeRef = useRef<Modalize>(null);
  const addMemberModalizeRef = useRef<Modalize>(null);
  const editGroupModalizeRef = useRef<Modalize>(null);
  const menuModalizeRef = useRef<Modalize>(null);
  const styles = useStyles(stylesheet);
  const [selectedMember, setSelectedMember] = useState();

  const onOpen = (selected: any) => {
    modalizeRef.current?.open();
    setSelectedMember(selected);
  };

  const onOpenAddMember = () => {
    addMemberModalizeRef.current?.open();
    menuModalizeRef.current?.close();
  };
  const onOpenEditGroup = () => {
    editGroupModalizeRef.current?.open();
    menuModalizeRef.current?.close();
  };
  const onOpenViewRequest = () => {
    navigation.navigate('GroupChatMemberRequest', {
      groupId: route.params.groupId,
      groupName: route.params.groupName,
      groupAccess: route.params.groupAccess,
    });
    menuModalizeRef.current?.close();
  };

  const onOpenMenu = (selected: any) => {
    setSelectedMember(selected);
    menuModalizeRef.current?.open();
  };

  return (
    <>
      <SafeAreaView style={styles.container}>
        <Modalize ref={modalizeRef}>
          <GroupAdminActions
            groupId={route.params.groupId}
            selectedMember={selectedMember}
            handleClose={() => modalizeRef.current?.close()}
            permissionData={permissionData as any}
          />
        </Modalize>
        <Modalize ref={editGroupModalizeRef}>
          <EditGroup
            permissionData={permissionData as any}
            metaData={groupMetaData as any}
            handleClose={() => editGroupModalizeRef.current?.close()}
            groupId={route.params.groupId ? route.params.groupId : ''}
          />
        </Modalize>
        <Modalize ref={addMemberModalizeRef}>
          <AddMemberView
            handleClose={() => addMemberModalizeRef.current?.close()}
            groupId={route.params.groupId ? route.params.groupId : ''}
          />
        </Modalize>

        <Modalize ref={menuModalizeRef}>
          <MenuBubble
            permissionData={permissionData as any}
            groupId={route.params.groupId}
            onOpenViewRequest={onOpenViewRequest}
            onEditGroup={onOpenEditGroup}
            onDeleteGroup={() => {
              mutate(
                {
                  groupId: route.params.groupId,
                },
                {
                  onSuccess: () => {
                    showToast({type: 'success', title: 'Group Deleted Successfully'});
                    queryClient.invalidateQueries({queryKey: ['getAllGroups']});
                    menuModalizeRef.current?.close();
                  },
                  onError: () => {
                    showToast({
                      type: 'error',
                      title: 'Error! Couldnt Delete Group. Please try again later.',
                    });
                  },
                },
              );
            }}
            onOpenAddMember={() => onOpenAddMember()}
          />
        </Modalize>

        <View>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() =>
                navigation.navigate('GroupChat', {
                  groupId: route.params.groupId,
                  groupName: route.params.groupName,
                  groupAccess: route.params.groupAccess,
                })
              }
            >
              <BackIcon width={24} height={24} stroke="gray" />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.groupName}>{route.params.groupName}</Text>
              <Text style={styles.memberCount}>
                {memberListData.data.pages.flat().length} members
              </Text>
            </View>
          </View>
        </View>

        <FlatList
          data={memberListData.data.pages.flat()}
          renderItem={({item}: any) => <MemberCard item={item} handleOpen={() => onOpen(item)} />}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={styles.memberList}
        />
        <Pressable style={styles.addMemberButton} onPress={onOpenMenu}>
          <AddPostIcon width={72} height={72} color={theme.theme.colors.primary} />
        </Pressable>
      </SafeAreaView>
    </>
  );
};

const MemberCard = ({item, handleOpen}: {item: any; handleOpen: () => void}) => {
  const {publicKey} = useAuth();
  const pub = item?.tags.find((tag: any) => tag[0] === 'p')?.[1];
  const styles = useStyles(stylesheet);
  return (
    <View style={styles.memberItem}>
      <View style={styles.memberInfo}>
        {publicKey === pub ? (
          <Text
            numberOfLines={1}
            ellipsizeMode="middle"
            style={{
              ...styles.memberName,
              color: 'blue',
            }}
          >
            {pub}
          </Text>
        ) : (
          <Text numberOfLines={1} ellipsizeMode="middle" style={styles.memberName}>
            {pub}
          </Text>
        )}

        <Text style={styles.memberRole}>{item.role}</Text>
      </View>

      <IconButton
        icon="MoreVerticalIcon"
        size={20}
        style={styles.iconButton}
        onPress={handleOpen}
      />
    </View>
  );
};
const MenuBubble = ({
  onOpenAddMember,
  onDeleteGroup,
  onEditGroup,
  onOpenViewRequest,
  permissionData,
}: {
  onOpenAddMember: () => void;
  onDeleteGroup: () => void;
  onEditGroup: () => void;
  onOpenViewRequest: () => void;
  permissionData: AdminGroupPermission[];
  groupId: string;
}) => {
  const styles = useStyles(stylesheet);
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Member Actions</Text>

      {permissionData && permissionData.includes(AdminGroupPermission.AddMember) && (
        <TouchableOpacity style={styles.actionButton} onPress={onOpenAddMember}>
          <UserPlusIcon width={24} height={24} color={theme.theme.colors.primary} />
          <Text style={styles.actionText}>Add Member</Text>
        </TouchableOpacity>
      )}

      {permissionData && permissionData.includes(AdminGroupPermission.EditMetadata) && (
        <TouchableOpacity onPress={onEditGroup} style={styles.actionButton}>
          <EditIcon width={24} height={24} color={theme.theme.colors.white} />
          <Text style={styles.actionText}>Edit Group</Text>
        </TouchableOpacity>
      )}

      {permissionData && permissionData.includes(AdminGroupPermission.AddMember) && (
        <TouchableOpacity style={styles.actionButton} onPress={() => onOpenViewRequest()}>
          <EditIcon width={24} height={24} color={theme.theme.colors.white} />
          <Text style={styles.actionText}>View Request</Text>
        </TouchableOpacity>
      )}

      {permissionData && permissionData.includes(AdminGroupPermission.DeleteGroup) && (
        <TouchableOpacity style={styles.actionButton} onPress={onDeleteGroup}>
          <TrashIcon width={24} height={24} color={theme.theme.colors.red} />
          <Text style={[styles.actionText, styles.deleteText]}>Delete Group</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default GroupChatDetail;
