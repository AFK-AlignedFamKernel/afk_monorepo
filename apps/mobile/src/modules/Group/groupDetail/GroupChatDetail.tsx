import {useQueryClient} from '@tanstack/react-query';
import {useAuth, useDeleteGroup, useGetGroupMemberList} from 'afk_nostr_sdk';
import React, {useRef, useState} from 'react';
import {FlatList, Pressable, SafeAreaView, TouchableOpacity, View} from 'react-native';

import {AddPostIcon, BackIcon, TrashIcon, UserPlusIcon} from '../../../assets/icons';
import {IconButton, Modalize, Text} from '../../../components';
import {useStyles, useTheme} from '../../../hooks';
import {useToast} from '../../../hooks/modals';
import {GroupChatDetailScreenProps} from '../../../types';
import AddMemberView from '../memberAction/addMember';
import GroupAdminActions from '../memberAction/groupAction';
import stylesheet from './styles';

const GroupChatDetail: React.FC<GroupChatDetailScreenProps> = ({navigation, route}) => {
  const theme = useTheme();
  const {publicKey: pubKey} = useAuth();
  const queryClient = useQueryClient();
  const {showToast} = useToast();
  const datas = useGetGroupMemberList({
    groupId: route.params.groupId,
  });
  console.log(datas.data, 'ddd');
  const {mutate} = useDeleteGroup();
  const modalizeRef = useRef<Modalize>(null);
  const addMemberModalizeRef = useRef<Modalize>(null);
  const menuModalizeRef = useRef<Modalize>(null);
  const styles = useStyles(stylesheet);
  const [selectedMember, setSelectedMember] = useState();
  const [groupName] = useState('Project Team');

  const onOpen = (selected: any) => {
    modalizeRef.current?.open();
    setSelectedMember(selected);
  };

  const onOpenAddMember = () => {
    addMemberModalizeRef.current?.open();
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
            selectedMember={selectedMember}
            handleClose={() => modalizeRef.current?.close()}
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
            onDeleteGroup={() => {
              mutate(
                {
                  groupId: route.params.groupId,
                },
                {
                  onSuccess: () => {
                    showToast({type: 'success', title: 'Group Deleted Successfully'});
                    queryClient.invalidateQueries({queryKey: ['getAllGroups', pubKey]});
                    menuModalizeRef.current?.close();
                    navigation.navigate('Tips');
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
              onPress={() => navigation.navigate('GroupChat', {groupId: route.params.groupId})}
            >
              <BackIcon width={24} height={24} stroke="gray" />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.groupName}>{groupName}</Text>
              <Text style={styles.memberCount}>{datas.data.pages.flat().length} members</Text>
            </View>
          </View>
        </View>

        <FlatList
          data={datas.data.pages.flat()}
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
  const styles = useStyles(stylesheet);
  return (
    <View style={styles.memberItem}>
      <View style={styles.memberInfo}>
        <Text numberOfLines={1} ellipsizeMode="middle" style={styles.memberName}>
          {item.tags[1][1]}
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
  onOpenAddMember,
  onDeleteGroup,
}: {
  onOpenAddMember: () => void;
  onDeleteGroup: () => void;
}) => {
  const styles = useStyles(stylesheet);
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Member Actions</Text>
      <TouchableOpacity style={styles.actionButton} onPress={onOpenAddMember}>
        <UserPlusIcon width={24} height={24} color={theme.theme.colors.primary} />
        <Text style={styles.actionText}>Add Member</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionButton} onPress={onDeleteGroup}>
        <TrashIcon width={24} height={24} color={theme.theme.colors.red} />
        <Text style={[styles.actionText, styles.deleteText]}>Delete Group</Text>
      </TouchableOpacity>
    </View>
  );
};

export default GroupChatDetail;
