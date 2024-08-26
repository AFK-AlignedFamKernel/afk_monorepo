import React, { useEffect, useState } from 'react';
import { FlatList, View } from 'react-native';
import { Conversation as ConversationPreview } from '../../components/Conversation';
import { useStyles } from '../../hooks';
import { Conversation } from '../../types/messages';
import { conversationsData } from '../../utils/dummyData';
import stylesheet from './styles';
import { Chat } from '../../components/Chat';

export const DirectMessages: React.FC = () => {

  const styles = useStyles(stylesheet);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  useEffect(() => {
    // Fetch the list of messages
    // const { conversationsData } = useGetMessages();
    setConversations(conversationsData);
  }, []);

  const handleGoBack = () => {
    setSelectedConversation(null);
  };

  return (
    <>

    <View>
      
    </View>


      {selectedConversation ? <Chat conversation={selectedConversation} handleGoBack={handleGoBack} />
        : (
          <View style={styles.container}>
            <FlatList
              data={conversations}
              keyExtractor={(conversation) => conversation.id}
              renderItem={({ item }) => (
                <ConversationPreview conversation={item} onPressed={() => setSelectedConversation(item)} />
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>
        )}
    </>

  );
};