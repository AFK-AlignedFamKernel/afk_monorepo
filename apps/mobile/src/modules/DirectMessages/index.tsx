import {useMyGiftWrapMessages, useMyMessagesSent} from 'afk_nostr_sdk';
import React, {useEffect, useState} from 'react';
import {FlatList, View} from 'react-native';

import {Conversation as ConversationPreview} from '../../components';
import {Chat} from '../../components/PrivateMessages/Chat';
import {FormPrivateMessage} from '../../components/PrivateMessages/FormPrivateMessage';
import {useStyles} from '../../hooks';
import {ConversationType} from '../../types/messages';
import {conversationsData} from '../../utils/dummyData';
import stylesheet from './styles';

export const DirectMessages: React.FC = () => {
  const styles = useStyles(stylesheet);
  const [conversations, setConversations] = useState<ConversationType[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationType | null>(null);

  const giftMessages = useMyGiftWrapMessages();
  const messagesSent = useMyMessagesSent();
  useEffect(() => {
    // Fetch the list of messages
    // const { conversationsData } = useGetMessages();
    setConversations(conversationsData);
  }, []);

  const handleGoBack = () => {
    setSelectedConversation(null);
  };

  console.log('giftMessages', giftMessages?.data?.pages);
  console.log('messagesSent', messagesSent?.data?.pages);

  return (
    <>
      <FormPrivateMessage></FormPrivateMessage>

      {selectedConversation ? (
        <Chat conversation={selectedConversation} handleGoBack={handleGoBack} />
      ) : (
        <View style={styles.container}>
          <FlatList
            data={conversations}
            keyExtractor={(conversation) => conversation.id}
            renderItem={({item}) => (
              <ConversationPreview
                conversation={item}
                onPressed={() => setSelectedConversation(item)}
              />
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>
      )}

      {/* <FlatList
        data={messagesSent?.data?.pages?.flat()}
        keyExtractor={(conversation) => conversation.id}
        renderItem={({ item }) => {
          // console.log("item",item)
          return (
            <ConversationPreview conversation={item} onPressed={() => setSelectedConversation(item)} />
          )
        }
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      /> */}
    </>
  );
};
