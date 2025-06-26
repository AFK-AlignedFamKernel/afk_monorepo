import React from 'react';
import {FlatList, Text, View} from 'react-native';

import {useStyles} from '../../../hooks';
import {Message} from '../../../types/messages';
import stylesheet from './styles';

export type MessagesListProps = {
  messages: Message[];
};

export const MessagesList: React.FC<MessagesListProps> = ({messages}) => {
  const styles = useStyles(stylesheet);

  const renderItem = ({item}: {item: Message}) => (
    <View style={[styles.messageContainer, item.isUser ? styles.userMessage : styles.otherMessage]}>
      <Text style={styles.messageText}>{item.message}</Text>
    </View>
  );

  return (
    <FlatList
      data={messages}
      keyExtractor={(item) => item.timestamp}
      renderItem={renderItem}
      inverted
      style={styles.list}
    />
  );
};
