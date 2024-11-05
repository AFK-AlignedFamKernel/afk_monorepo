import {Feather} from '@expo/vector-icons';
import {useQueryClient} from '@tanstack/react-query';
import {useAuth, useLiveActivity} from 'afk_nostr_sdk';
import React from 'react';
import {FlatList, Pressable, Text, View} from 'react-native';
import {TextInput} from 'react-native';

import {LoadingSpinner} from '../../components/Loading';
import {useStyles} from '../../hooks';
import {useToast} from '../../hooks/modals';
import stylesheet from './styles';

export function LiveChatView({
  newMessage,
  setIsChatOpen,
  setNewMessage,
  eventId,
}: {
  newMessage: string;
  setIsChatOpen: () => void;
  setNewMessage: any;
  eventId: string;
}) {
  const {publicKey} = useAuth();
  const {showToast} = useToast();
  const queryClient = useQueryClient();
  const {useGetLiveChat, sendChatMessage} = useLiveActivity();
  const styles = useStyles(stylesheet);

  const chatMessages = useGetLiveChat({
    limit: 20,
  });

  console.log(chatMessages.data?.pages, 'message');

  const handleSendMessage = () => {
    if (!newMessage) return;
    sendChatMessage.mutate(
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
        },
        onError() {
          showToast({title: 'Error sending message', type: 'error'});
        },
      },
    );
  };
  return (
    <View style={styles.chatContainer}>
      <View style={styles.chatHeader}>
        <Text style={styles.chatTitle}>Live Chat</Text>
        <Pressable onPress={() => setIsChatOpen()}>
          <Feather name="x" size={20} style={styles.actionButtonText} />
        </Pressable>
      </View>

      {chatMessages.data?.pages.flat().length === 0 && <View style={styles.chatMessages}></View>}

      {chatMessages?.data && chatMessages?.data.pages.flat().length > 0 && (
        <FlatList
          style={styles.chatMessages}
          data={chatMessages?.data.pages.flat()}
          keyExtractor={(item) => item.id}
          renderItem={({item}) => (
            <View style={styles.messageContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>Sender</Text>
              </View>
              <View style={styles.messageContent}>
                <Text style={styles.messageSender}>Sender Agein</Text>
                <Text style={styles.messageText}>{item.content}</Text>
              </View>
            </View>
          )}
        />
      )}

      <View style={styles.chatInputContainer}>
        <TextInput
          style={styles.chatInput}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          placeholderTextColor="#666"
        />
        <Pressable
          disabled={sendChatMessage.isPending}
          style={styles.sendButton}
          onPress={handleSendMessage}
        >
          <Text style={styles.sendButtonText}>
            {sendChatMessage.isPending ? <LoadingSpinner size={14} /> : 'Send'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
