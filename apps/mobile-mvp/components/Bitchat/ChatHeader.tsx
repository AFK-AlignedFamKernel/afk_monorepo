import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';

interface ChatHeaderProps {
  nickname: string;
  onNicknameChange: (name: string) => void;
  peerCount: number;
  currentChannel?: string;
  selectedPrivatePeer?: string;
  onSidebarToggle?: () => void;
  onShowAppInfo?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  nickname,
  onNicknameChange,
  peerCount,
  currentChannel,
  selectedPrivatePeer,
  onSidebarToggle,
  onShowAppInfo,
}) => {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>bitchat*</Text>
      <View style={styles.nicknameRow}>
        <Text style={styles.label}>@</Text>
        <TextInput
          style={styles.nicknameInput}
          value={nickname}
          onChangeText={onNicknameChange}
          placeholder="nickname"
          maxLength={20}
        />
      </View>
      {selectedPrivatePeer ? (
        <Text style={styles.channel}>{`DM: ${selectedPrivatePeer}`}</Text>
      ) : currentChannel ? (
        <Text style={styles.channel}>{`#${currentChannel}`}</Text>
      ) : null}
      <Text style={styles.peerCount}>{`peers: ${peerCount}`}</Text>
      {onSidebarToggle && (
        <TouchableOpacity onPress={onSidebarToggle} style={styles.iconButton}>
          <Text style={styles.icon}>☰</Text>
        </TouchableOpacity>
      )}
      {onShowAppInfo && (
        <TouchableOpacity onPress={onShowAppInfo} style={styles.iconButton}>
          <Text style={styles.icon}>ℹ️</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#181818',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  title: {
    color: '#00FF00',
    fontWeight: 'bold',
    fontSize: 20,
    fontFamily: 'monospace',
    marginRight: 12,
  },
  nicknameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    borderRadius: 6,
    paddingHorizontal: 6,
    marginRight: 12,
  },
  label: {
    color: '#00FF00',
    fontFamily: 'monospace',
    fontSize: 16,
  },
  nicknameInput: {
    color: '#00FF00',
    fontFamily: 'monospace',
    fontSize: 16,
    minWidth: 60,
    maxWidth: 120,
    padding: 0,
    marginLeft: 2,
  },
  channel: {
    color: '#FF9500',
    fontFamily: 'monospace',
    fontSize: 14,
    marginRight: 12,
  },
  peerCount: {
    color: '#00FF00',
    fontFamily: 'monospace',
    fontSize: 14,
    marginLeft: 'auto',
    marginRight: 8,
  },
  iconButton: {
    marginLeft: 4,
    padding: 4,
  },
  icon: {
    fontSize: 18,
    color: '#00FF00',
  },
});

export default ChatHeader; 