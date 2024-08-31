import {useQueryClient} from '@tanstack/react-query';
import {
  AdminGroupPermission,
  useAddMember,
  useAddPermissions,
  useGetGroupMemberList,
  useGetGroupPermission,
  useGetGroupRequest,
} from 'afk_nostr_sdk';
import React, {useRef, useState} from 'react';
import {FlatList, SafeAreaView, TouchableOpacity, View} from 'react-native';

import {BackIcon, UserPlusIcon} from '../../../assets/icons';
import {IconButton, Modalize, Text} from '../../../components';
import {useStyles, useTheme} from '../../../hooks';
import {useToast} from '../../../hooks/modals';
import {GroupChatMemberRequestScreenProps} from '../../../types';
import stylesheet from '../groupDetail/styles';

const GroupChatGroupRequest: React.FC<GroupChatMemberRequestScreenProps> = ({
  navigation,
  route,
}) => {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<any>();
  const {showToast} = useToast();
  const {mutate} = useAddMember();
  const {mutate: addPermission} = useAddPermissions();
  const {data: permissionData} = useGetGroupPermission(route.params.groupId as any);
  const viewGroupRequest = useGetGroupRequest({
    groupId: route.params.groupId,
  });
  const groupMembers = useGetGroupMemberList({
    groupId: route.params.groupId,
  });

  const modalizeRef = useRef<Modalize>(null);

  const styles = useStyles(stylesheet);

  //Todo: you can check from the permission instead maybe?
  const checkIfMemberExists = () => {
    return groupMembers?.data.pages.some((page: any) =>
      page.some((event: any) =>
        event.tags.some(
          (tag: any) =>
            tag[0] === 'p' && tag[1] === selected?.tags.find((tag: any) => tag[0] === 'p')?.[1],
        ),
      ),
    );
  };

  return (
    <>
      <SafeAreaView style={styles.container}>
        <Modalize ref={modalizeRef}>
          <MenuBubble
            onDeclineRequest={() => console.log('')}
            onAcceptRequest={() => {
              //Check if the pubKey that wants to be added exist
              if (checkIfMemberExists()) {
                showToast({
                  type: 'error',
                  title: 'Error! This public key is already a member of the group.',
                });
              } else {
                mutate(
                  {
                    pubkey: selected?.tags.find((tag: any) => tag[0] === 'p')?.[1],
                    groupId: route.params.groupId,
                    permissionData: permissionData as any,
                  },
                  {
                    onSuccess() {
                      // After successfully adding external member by pubkey, give them default view access.
                      addPermission(
                        {
                          groupId: route.params.groupId,
                          pubkey: selected?.tags.find((tag: any) => tag[0] === 'p')?.[1],
                          permissionName: [AdminGroupPermission.ViewAccess],
                        },
                        {
                          onSuccess() {
                            showToast({
                              type: 'success',
                              title: 'Member added and permissions set successfully',
                            });
                            queryClient.invalidateQueries({queryKey: ['getAllGroupMember']});
                            queryClient.invalidateQueries({
                              queryKey: ['getPermissionsByUserConnected', route.params.groupId],
                            });
                            modalizeRef.current?.close();
                          },
                          onError() {
                            showToast({
                              type: 'error',
                              title:
                                'Member added but permissions could not be set. Please set permissions manually.',
                            });
                            queryClient.invalidateQueries({queryKey: ['getAllGroupMember']});
                          },
                        },
                      );
                    },
                    onError() {
                      showToast({
                        type: 'error',
                        title: 'Error! Member could not be added. Please try again later.',
                      });
                    },
                  },
                );
              }
            }}
          />
        </Modalize>

        <View>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() =>
                navigation.navigate('GroupChatDetail', {
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
                {viewGroupRequest.data.pages.flat().length} Request
              </Text>
            </View>
          </View>
        </View>

        <FlatList
          data={viewGroupRequest.data.pages.flat()}
          renderItem={({item}: any) => (
            <MemberCard
              item={item}
              handleOpen={() => {
                modalizeRef.current?.open();
                setSelected(item);
              }}
            />
          )}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={styles.memberList}
        />
      </SafeAreaView>
    </>
  );
};

const MemberCard = ({item, handleOpen}: {item: any; handleOpen: () => void}) => {
  const pub = item?.tags.find((tag: any) => tag[0] === 'p')?.[1];
  const styles = useStyles(stylesheet);
  return (
    <View style={styles.memberItem}>
      <View style={styles.memberInfo}>
        <Text numberOfLines={1} ellipsizeMode="middle" style={styles.memberName}>
          {pub}
        </Text>
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
  onAcceptRequest,
  onDeclineRequest,
}: {
  onDeclineRequest: () => void;
  onAcceptRequest: () => void;
}) => {
  const styles = useStyles(stylesheet);
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Request Actions</Text>
      <TouchableOpacity style={styles.actionButton} onPress={onAcceptRequest}>
        <UserPlusIcon width={24} height={24} color={theme.theme.colors.primary} />
        <Text style={styles.actionText}>Accept Request</Text>
      </TouchableOpacity>
      {/* <TouchableOpacity style={styles.actionButton} onPress={onDeclineRequest}>
        <TrashIcon width={24} height={24} color={theme.theme.colors.red} />
        <Text style={[styles.actionText, styles.deleteText]}>Decline Group</Text>
      </TouchableOpacity> */}
    </View>
  );
};

export default GroupChatGroupRequest;
