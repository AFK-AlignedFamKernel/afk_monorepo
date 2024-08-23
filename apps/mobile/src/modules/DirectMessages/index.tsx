import React, { useEffect, useState } from 'react';
import { FlatList, View } from 'react-native';
import { Conversation as ConversationPreview } from '../../components/Conversation';
import { useStyles } from '../../hooks';
import { Conversation } from '../../types/messages';
import { conversationsData } from '../../utils/dummyData';
import stylesheet from './styles';

export const DirectMessages: React.FC = () => {

  const styles = useStyles(stylesheet);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    // Fetch the list of messages
    // const { conversationsData } = useGetMessages();
    setConversations(conversationsData);
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        keyExtractor={(conversation) => conversation.id}
        renderItem={({ item }) => (
          <ConversationPreview conversation={item} />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};