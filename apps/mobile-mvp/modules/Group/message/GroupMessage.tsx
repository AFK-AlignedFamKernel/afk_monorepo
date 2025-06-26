import {useQueryClient} from '@tanstack/react-query';
import {
  AdminGroupPermission,
  useAuth,
  useGetGroupMemberList,
  useGetGroupMessages,
  useGetGroupPermission,
  useJoinGroupRequest,
  useProfile,
  useSendGroupMessages,
} from 'afk_nostr_sdk';
import React, {useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {BackIcon, MenuIcons} from '../../../assets/icons';
import {Button, IconButton, Input, KeyboardFixedView} from '../../../components';
import {useNostrAuth, useStyles} from '../../../hooks';
import {useToast} from '../../../hooks/modals';
import {GroupChatScreenProps} from '../../../types';
import stylesheet from './styles';

const GroupChat: React.FC<GroupChatScreenProps> = ({navigation, route}) => {
  const {publicKey} = useAuth();
  const groupId = route.params.groupId;
  const memberListData = useGetGroupMemberList({groupId});
  const profile = useProfile({publicKey});
  const [menuVisible, setMenuVisible] = useState(false);
  const [replyToId, setReplyToId] = useState(null);
  const [replyToContent, setReplyToContent] = useState('');
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const queryClient = useQueryClient();
  const {showToast} = useToast();
  const {data: messageData} = useGetGroupMessages({groupId, authors: publicKey});
  const {mutate, mutateAsync} = useSendGroupMessages();
  const styles = useStyles(stylesheet);
  const [message, setMessage] = useState('');
  const {data: permissionData} = useGetGroupPermission(route.params.groupId);
  const {handleCheckNostrAndSendConnectDialog} = useNostrAuth();

  // const isMember = memberListData?.data?.pages?.flat().some((e: NDKEvent) => {
  //   const pubkey = e?.tags?.find((tag: string[]) => tag[0] === 'p')?.[1];
  //   return pubkey === publicKey;
  // });

  const handleLongPress = (messageId: any, messageContent: string) => {
    setSelectedMessageId(messageId);
    setReplyToContent(messageContent);
    setMenuVisible(true);
  };

  const handleReply = () => {
    setReplyToId(selectedMessageId);
    setMenuVisible(false);
  };

  const cancelReply = () => {
    setReplyToId(null);
    setReplyToContent('');
  };

  const sendMessage = async () => {
    if (!message) return;
    await handleCheckNostrAndSendConnectDialog();

    await mutateAsync(
      {
        content: message,
        groupId,
        pubkey: publicKey,
        name: profile.data?.nip05,
        replyId: replyToId ?? (null as any),
      },
      {
        onSuccess() {
          showToast({type: 'success', title: 'Message sent successfully'});
          queryClient.invalidateQueries({queryKey: ['getGroupMessages', groupId]});
          setMessage('');
          cancelReply();
        },
        onError() {
          showToast({
            type: 'error',
            title: 'Error! Comment could not be sent. Please try again later.',
          });
        },
      },
    );
  };

  if (memberListData.data.pages.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (
    !permissionData?.includes(AdminGroupPermission.ViewAccess) &&
    route.params.groupAccess === 'private'
  ) {
    return (
      <NoAccessScreen
        navigation={navigation}
        groupId={route.params.groupId}
        groupName={route.params.groupName}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <BackIcon stroke="gray" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{route.params.groupName}</Text>
          <Text style={styles.headerSubtitle}>
            {memberListData.data.pages.flat().length} members
          </Text>
        </View>

        {/* If you user have any other permission apart from view then show this menu*/}
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('GroupChatDetail', {
              groupId: route.params.groupId,
              groupName: route.params.groupName,
              groupAccess: route.params.groupAccess,
            })
          }
          style={styles.headerButton}
        >
          <MenuIcons stroke="gray" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={messageData.pages.flat()}
        renderItem={({item}: any) => <MessageCard handleLongPress={handleLongPress} item={item} />}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={styles.messageList}
        inverted
      />

      {replyToId && <ReplyIndicator message={replyToContent} onCancel={cancelReply} />}

      <KeyboardFixedView containerProps={{style: styles.inputContainer}}>
        <View style={styles.inputContent}>
          <Input
            multiline
            numberOfLines={2}
            value={message}
            onChangeText={setMessage}
            inputStyle={styles.input}
            containerStyle={styles.input}
            placeholder={replyToId ? 'Type your reply...' : 'Type your message...'}
          />

          <IconButton onPress={() => sendMessage()} icon="SendIcon" size={24} />
        </View>
      </KeyboardFixedView>

      <LongPressMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onReply={handleReply}
      />
    </SafeAreaView>
  );
};

const NoAccessScreen = ({
  navigation,
  groupName,
  groupId,
}: {
  navigation: any;
  groupName: string;
  groupId: string;
}) => {
  const {showToast} = useToast();
  const queryClient = useQueryClient();
  const {mutate: joinRequest} = useJoinGroupRequest();
  const styles = useStyles(stylesheet);
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <BackIcon stroke="gray" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{groupName || 'Group'}</Text>
        </View>
        <View style={styles.headerButton} />
      </View>
      <View
        style={{
          marginTop: 10,
          padding: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 7,
        }}
      >
        <Text style={styles.headerTitle}>No Access</Text>
        <Text style={styles.headerSubtitle}>You are not a member of this group.</Text>
        <Button
          style={{
            marginTop: 10,
          }}
          onPress={() =>
            //Do A check to see if the pubkey have already requested
            joinRequest(
              {
                groupId,
                content: '',
              },
              {
                onSuccess() {
                  showToast({type: 'success', title: 'Request Sent successfully'});
                  queryClient.invalidateQueries({queryKey: ['getGroupRequest', groupId]});
                },
                onError() {
                  showToast({
                    type: 'error',
                    title: 'Error! Request could not be sent. Please try again.',
                  });
                },
              },
            )
          }
        >
          Request to Join
        </Button>
      </View>
    </SafeAreaView>
  );
};

const MessageCard = ({
  item,
  handleLongPress,
}: {
  item: any;
  handleLongPress: (val: any, content: string) => void;
}) => {
  const styles = useStyles(stylesheet);
  const memberNip = item?.tags.find((tag: any) => tag[0] === 'name')?.[1];
  const replymemberNip = item?.reply
    ? item?.reply.tags.find((tag: any) => tag[0] === 'name')?.[1]
    : '';

  return (
    <Pressable onLongPress={() => handleLongPress(item.id, item.content)} delayLongPress={500}>
      <View style={styles.messageBubble}>
        {item.reply && <Text style={styles.senderName}>{memberNip || 'Nil'}</Text>}
        {item.reply && (
          <View style={styles.replyContainer}>
            <Text style={styles.replySender}>{replymemberNip || 'Nil'}</Text>
            <Text style={styles.replyContentHighlight} numberOfLines={1}>
              {item.reply.content}
            </Text>
          </View>
        )}
        {!item.reply && <Text style={styles.senderName}>{memberNip || 'Nil'}</Text>}

        <Text style={styles.messageText}>{item.content}</Text>
      </View>
    </Pressable>
  );
};

const ReplyIndicator = ({message, onCancel}: {onCancel: () => void; message: string}) => {
  const styles = useStyles(stylesheet);
  return (
    <View style={styles.replyIndicator}>
      <View style={styles.replyContent}>
        <Text style={styles.replyText} numberOfLines={1}>
          Replying to: {message}
        </Text>
      </View>
      <Pressable onPress={onCancel} style={styles.cancelButton}>
        <Text style={styles.cancelButtonText}>✕</Text>
      </Pressable>
    </View>
  );
};

const LongPressMenu = ({
  visible,
  onClose,
  onReply,
}: {
  visible: boolean;
  onClose: () => void;
  onReply: any;
}) => {
  const styles = useStyles(stylesheet);
  return (
    <Modal transparent={true} visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.menuContainer}>
          <Pressable style={styles.menuItem} onPress={onReply}>
            <Text style={{color: 'white'}}>Reply Message</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
};

export default GroupChat;
