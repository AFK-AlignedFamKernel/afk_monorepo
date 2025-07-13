import React, { useRef, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

export interface ChatMessage {
  id: string;
  sender: string;
  timestamp: number;
  content: string;
}

interface MessageListProps {
  messages: ChatMessage[];
  currentUserNickname: string;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, currentUserNickname }) => {
  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const renderItem = ({ item }: { item: ChatMessage }) => (
    <View style={styles.messageRow}>
      <Text style={styles.timestamp}>[{new Date(item.timestamp).toLocaleTimeString()}]</Text>
      <Text style={[styles.sender, item.sender === currentUserNickname && styles.senderSelf]}>{`<@${item.sender}>`}</Text>
      <Text style={styles.content}>{item.content}</Text>
    </View>
  );

  return (
    <FlatList
      ref={flatListRef}
      data={messages}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      style={styles.messageList}
      contentContainerStyle={{ paddingBottom: 8 }}
    />
  );
};

const styles = StyleSheet.create({
  messageList: {
    flex: 1,
    backgroundColor: '#111',
    paddingHorizontal: 8,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 2,
  },
  timestamp: {
    color: '#888',
    fontSize: 12,
    fontFamily: 'monospace',
    marginRight: 4,
  },
  sender: {
    color: '#00FF00',
    fontWeight: 'bold',
    fontFamily: 'monospace',
    marginRight: 4,
    fontSize: 14,
  },
  senderSelf: {
    color: '#FF9500',
  },
  content: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'monospace',
    flexShrink: 1,
  },
});

export default MessageList; 