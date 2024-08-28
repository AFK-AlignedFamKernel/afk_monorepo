import {useQueryClient} from '@tanstack/react-query';
import {useAuth, useGetGroupMessages, useProfile, useSendGroupMessages} from 'afk_nostr_sdk';
import React, {useState} from 'react';
import {FlatList, Modal, Pressable, SafeAreaView, Text, TouchableOpacity, View} from 'react-native';

import {BackIcon, MenuIcons} from '../../../assets/icons';
import {IconButton, Input, KeyboardFixedView} from '../../../components';
import {useStyles} from '../../../hooks';
import {useToast} from '../../../hooks/modals';
import {GroupChatScreenProps} from '../../../types';
import stylesheet from './styles';

const groupName = 'Project Team';
const memberCount = 15;

const GroupChat: React.FC<GroupChatScreenProps> = ({navigation, route}) => {
  const {publicKey} = useAuth();
  const profile = useProfile({publicKey});
  const [menuVisible, setMenuVisible] = useState(false);
  const [replyToId, setReplyToId] = useState(null);
  const [replyToContent, setReplyToContent] = useState('');
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const queryClient = useQueryClient();
  const {showToast} = useToast();
  const {data: messageData} = useGetGroupMessages({
    groupId: route.params.groupId,
    authors: publicKey,
  });
  const {mutate} = useSendGroupMessages();

  console.log(messageData, 'data');
  const styles = useStyles(stylesheet);
  const [message, setMessage] = useState('');

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

  const sendMessage = () => {
    if (!message) return;
    mutate(
      {
        content: message,
        groupId: route.params.groupId,
        pubkey: publicKey,
        name: profile.data?.nip05,
        replyId: replyToId ?? (null as any),
      },
      {
        onSuccess() {
          showToast({type: 'success', title: 'Message sent successfully'});
          queryClient.invalidateQueries({queryKey: ['getGroupMessages', route.params.groupId]});
          setMessage('');
          setReplyToId(null);
          setReplyToContent('');
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <BackIcon stroke="gray" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{groupName}</Text>
          <Text style={styles.headerSubtitle}>{memberCount} members</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('GroupChatDetail', {groupId: route.params.groupId})}
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

// TODO: MOVE TO COMPONENT
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

  // item.sender === 'You' ? styles.yourMessage : styles.otherMessage,
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
