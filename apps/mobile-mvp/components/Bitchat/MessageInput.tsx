import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList } from 'react-native';

interface MessageInputProps {
  value: string;
  onValueChange: (text: string) => void;
  onSend: () => void;
  nickname: string;
  commandSuggestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  value,
  onValueChange,
  onSend,
  nickname,
  commandSuggestions = [],
  onSuggestionClick,
}) => {
  return (
    <View style={styles.inputSection}>
      {commandSuggestions.length > 0 && (
        <View style={styles.suggestionsBox}>
          <FlatList
            data={commandSuggestions}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => onSuggestionClick && onSuggestionClick(item)}>
                <Text style={styles.suggestion}>{item}</Text>
              </TouchableOpacity>
            )}
            horizontal
          />
        </View>
      )}
      <View style={styles.inputRow}>
        <Text style={styles.inputLabel}>{`<@${nickname}>`}</Text>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onValueChange}
          placeholder="Type a message..."
          onSubmitEditing={onSend}
          returnKeyType="send"
        />
        <TouchableOpacity style={styles.sendButton} onPress={onSend}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  inputSection: {
    backgroundColor: '#181818',
    borderTopWidth: 1,
    borderTopColor: '#222',
    padding: 8,
  },
  suggestionsBox: {
    marginBottom: 4,
    backgroundColor: '#222',
    borderRadius: 6,
    padding: 4,
  },
  suggestion: {
    color: '#00FF00',
    fontFamily: 'monospace',
    fontSize: 14,
    marginRight: 8,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    backgroundColor: '#181818',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputLabel: {
    color: '#00FF00',
    fontFamily: 'monospace',
    fontSize: 14,
    marginRight: 4,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontFamily: 'monospace',
    fontSize: 16,
    backgroundColor: '#222',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#00FF00',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sendButtonText: {
    color: '#111',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'monospace',
  },
});

export default MessageInput; 