import {useQueryClient} from '@tanstack/react-query';
import {useAuth, useRoomMessages, useSendPrivateMessage} from 'afk_nostr_sdk';
import React from 'react';
import {FlatList, Image, Text, View} from 'react-native';

import {useStyles} from '../../../hooks';
import {useToast} from '../../../hooks/modals';
import {IconButton} from '../../IconButton';
import {MessageInput} from '../PrivateMessageInput';
import stylesheet from './styles';

export type ChatProps = {
  item: {
    id: number;
    pubkey: number;
    created_at: string;
    decryptedContent: string;
    senderPublicKey: string;
    receiverPublicKey: string;
    user: any;
    name: string;
  };
  user?: any;
  handleGoBack: () => void;
};

export const Chat: React.FC<ChatProps> = ({item, handleGoBack, user}) => {
  const {publicKey} = useAuth();
  const {showToast} = useToast();
  const queryClient = useQueryClient();
  const {mutateAsync} = useSendPrivateMessage();
  const roomIds = [item?.senderPublicKey, item?.receiverPublicKey];
  // console.log('roomIds', roomIds);
  //Use this to get Message sent between 2 pubKey
  const messagesSent = useRoomMessages({
    roomParticipants: roomIds,
  });

  React.useEffect(() => {
    if (!item) {
      queryClient.setQueryData(['messagesSent'], { pages: [], pageParams: [] });
    }
  }, [item, queryClient]);
  // console.log('messagesSent', messagesSent);
  const styles = useStyles(stylesheet);

  const avatar = user?.avatar ? {uri: user.avatar} : require('../../../assets/pepe-logo.png');

  const handleSendMessage = async (message: string) => {
    if (!message) return;
    const receiverPublicKey = roomIds.find((id) => id !== publicKey);
    if (!receiverPublicKey) {
      showToast({title: 'Invalid receiver', type: 'error'});
      return;
    }
    await mutateAsync(
      {
        content: message,
        receiverPublicKeyProps: receiverPublicKey,
      },
      {
        onSuccess: () => {
          // showToast({title: 'Message sent', type: 'success'});
          queryClient.invalidateQueries({
            queryKey: ['messagesSent'],
          });
        },
        onError() {
          showToast({title: 'Error sending message', type: 'error'});
        },
      },
    );
  };

  return (
    <>
      <View style={styles.header}>
        <IconButton
          icon="ChevronLeftIcon"
          size={20}
          onPress={handleGoBack}
          style={styles.backButton}
        />
        <View style={styles.headerContent}>
          <Image source={avatar} style={styles.avatar} />
          <Text style={styles.name}>{item?.name}</Text>
        </View>
      </View>
      <View style={styles.container}>
        <FlatList
          data={messagesSent.data?.pages.flat()}
          keyExtractor={(item, index) => item?.id ?? index.toString()}
          renderItem={({item}: any) => <MessageCard publicKey={publicKey} item={item} />}
          inverted
          style={styles.list}
        />
        <MessageInput onSend={handleSendMessage} />
      </View>
    </>
  );
};

const MessageCard = ({item, publicKey}: Omit<ChatProps, 'handleGoBack'> & {publicKey: string}) => {
  const isUser = item?.senderPublicKey === publicKey;
  const styles = useStyles(stylesheet);

  return (
    <View style={[styles.messageContainer, isUser ? styles.userMessage : styles.otherMessage]}>
      <Text style={styles.messageText}>{item?.decryptedContent}</Text>
    </View>
  );
};
