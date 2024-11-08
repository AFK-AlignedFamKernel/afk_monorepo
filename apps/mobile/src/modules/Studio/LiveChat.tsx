import {Feather} from '@expo/vector-icons';
import {useQueryClient} from '@tanstack/react-query';
import {useAuth, useLiveActivity} from 'afk_nostr_sdk';
import React, {useState} from 'react';
import {FlatList, Modal, Pressable, SafeAreaView, Text, TextInput, View} from 'react-native';

import {LoadingSpinner} from '../../components/Loading';
import {useStyles} from '../../hooks';
import {useToast} from '../../hooks/modals';
import stylesheet from './livestyle';

export interface ParsedLiveChatMessage {
  id: string;
  pubkey: string;
  content: string;
  created_at: number;
  replyTo?: {
    id: string;
    marker: string;
  };
  root?: {
    type: string;
    id: string;
    relay?: string;
  };
}

export function LiveChatView({
  eventId,
  setIsChatOpen,
  newMessage,
  setNewMessage,
}: {
  newMessage: string;
  setIsChatOpen: () => void;
  setNewMessage: any;
  eventId: string;
}) {
  const {publicKey} = useAuth();
  const {showToast} = useToast();
  const queryClient = useQueryClient();
  const {useGetLiveChat, useSendLiveChatMessage} = useLiveActivity();
  const styles = useStyles(stylesheet);

  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyToContent, setReplyToContent] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  const chatMessages = useGetLiveChat({
    limit: 100,
    eventId,
  });

  const handleSendMessage = () => {
    if (!newMessage) return;

    if (replyToId) {
      useSendLiveChatMessage.mutate(
        {
          content: newMessage,
          eventId,
          pubkey: publicKey,
          replyTo: {
            id: replyToId as any,
            marker: 'reply',
          },
        },
        {
          onSuccess() {
            queryClient.invalidateQueries({
              queryKey: ['liveChatMessages'],
            });
            setNewMessage('');
            cancelReply();
          },
          onError() {
            showToast({title: 'Error sending message', type: 'error'});
          },
        },
      );
    } else {
      useSendLiveChatMessage.mutate(
        {
          content: newMessage,
          eventId,
          pubkey: publicKey,
        },
        {
          onSuccess() {
            queryClient.invalidateQueries({
              queryKey: ['liveChatMessages'],
            });
            setNewMessage('');
            cancelReply();
          },
          onError() {
            showToast({title: 'Error sending message', type: 'error'});
          },
        },
      );
    }
  };

  const handleLongPress = (messageId: string, messageContent: string) => {
    setSelectedMessageId(messageId);
    setReplyToContent(messageContent);
    setMenuVisible(true);
  };

  const handleReply = () => {
    if (selectedMessageId) {
      setReplyToId(selectedMessageId);
    }
    setMenuVisible(false);
  };

  const cancelReply = () => {
    setReplyToId(null);
    setReplyToContent('');
  };

  return (
    <SafeAreaView style={styles.chatContainer}>
      <View style={styles.chatHeader}>
        <Text style={styles.chatTitle}>Live Chat</Text>
        <Pressable onPress={setIsChatOpen}>
          <Feather name="x" size={20} style={styles.actionButtonText} />
        </Pressable>
      </View>

      <FlatList
        contentContainerStyle={styles.chatMessages}
        data={chatMessages.data?.pages.flat()}
        keyExtractor={(item) => item.id}
        renderItem={({item}) => <MessageCard item={item} handleLongPress={handleLongPress} />}
        inverted
      />

      {replyToId && <ReplyIndicator message={replyToContent} onCancel={cancelReply} />}

      <View style={styles.chatInputContainer}>
        <TextInput
          style={styles.chatInput}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder={replyToId ? 'Type your reply...' : 'Type a message...'}
          placeholderTextColor="#666"
        />
        <Pressable
          disabled={useSendLiveChatMessage.isPending}
          style={styles.sendButton}
          onPress={handleSendMessage}
        >
          <Text style={styles.sendButtonText}>
            {useSendLiveChatMessage.isPending ? <LoadingSpinner size={14} /> : 'Send'}
          </Text>
        </Pressable>
      </View>

      <LongPressMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onReply={handleReply}
      />
    </SafeAreaView>
  );
}

const MessageCard = ({
  item,
  handleLongPress,
}: {
  item: ParsedLiveChatMessage;
  handleLongPress: (id: string, content: string) => void;
}) => {
  const styles = useStyles(stylesheet);

  return (
    <Pressable onLongPress={() => handleLongPress(item.id, item.content)} delayLongPress={500}>
      <View style={styles.messageContainer}>
        {/* <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.pubkey.slice(0, 2)}</Text>
        </View> */}
        <View style={styles.messageContent}>
          <Text style={styles.messageSender}>{item.pubkey.slice(0, 8)}</Text>
          {item.replyTo && (
            <View style={styles.replyContainer}>
              <Text style={styles.replySender}>Reply to: {item.content.slice(0, 8)}</Text>
            </View>
          )}
          <Text style={styles.messageText}>{item.content}</Text>
        </View>
      </View>
    </Pressable>
  );
};

const ReplyIndicator = ({message, onCancel}: {message: string; onCancel: () => void}) => {
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
  onReply: () => void;
}) => {
  const styles = useStyles(stylesheet);
  return (
    <Modal transparent={true} visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.menuContainer}>
          <Pressable style={styles.menuItem} onPress={onReply}>
            <Text style={styles.menuItemText}>Reply Message</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
};
