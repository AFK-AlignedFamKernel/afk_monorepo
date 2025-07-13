import React, { useState, useEffect, useRef } from 'react';
import { View, KeyboardAvoidingView, Platform, StyleSheet, Button, TextInput, Text } from 'react-native';
import { ChatHeader } from './ChatHeader';
import { MessageList, ChatMessage } from './MessageList';
import { MessageInput } from './MessageInput';
import { Sidebar } from './Sidebar';
import { useBitchatWebRTC } from '../../hooks/bitchat/useBitchatWebRTC';
import { useChannelChat } from '../../hooks/bitchat/useChannelChat';

// Simple Toast for web
function showToastWeb(msg: string) {
  if (typeof window !== 'undefined') {
    window.alert(msg); // Use alert for demo purposes
  }
}

export const ChatScreen: React.FC = () => {
  const [nickname, setNickname] = useState('anon');
  const [messageText, setMessageText] = useState('');
  const [commandSuggestions, setCommandSuggestions] = useState<string[]>([]);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [selectedPeer, setSelectedPeer] = useState<string | null>(null);

  // Channel chat logic
  const {
    channels,
    currentChannel,
    messages: channelMessages,
    joinChannel,
    leaveChannel,
    sendChannelMessage,
    setCurrentChannel,
  } = useChannelChat(nickname);

  // DM chat logic (WebRTC)
  const [myId] = useState(() => Math.random().toString(36).slice(2, 10));
  const { peers: rtcPeers, messages: dmMessages, connectToPeer, sendMessage, logs } = useBitchatWebRTC(myId);
  const lastLogRef = useRef<string | null>(null);

  // Show toast for latest log (DM only)
  useEffect(() => {
    if (selectedPeer && logs.length > 0 && logs[logs.length - 1] !== lastLogRef.current) {
      const latest = logs[logs.length - 1];
      lastLogRef.current = latest;
      if (Platform.OS === 'web') {
        showToastWeb(latest);
      }
    }
  }, [logs, selectedPeer]);

  // Handler for sending a message
  const handleSend = () => {
    const trimmed = messageText.trim();
    if (!trimmed) return;
    if (selectedPeer) {
      // DM mode: send via WebRTC
      sendMessage(selectedPeer, trimmed);
    } else if (currentChannel) {
      // Channel mode: send via socket.io
      console.log('Sending message to channel:', trimmed);
      sendChannelMessage(trimmed);
    }
    setMessageText('');
    setCommandSuggestions([]);
  };

  // Handler for input change (update suggestions)
  const handleInputChange = (text: string) => {
    setMessageText(text);
    if (text.startsWith('/')) {
      setCommandSuggestions(['/block', '/channels', '/clear', '/hug', '/j', '/m', '/slap', '/unblock', '/w'].filter(cmd => cmd.startsWith(text)));
    } else {
      setCommandSuggestions([]);
    }
  };

  // Handler for selecting a command suggestion
  const handleSuggestionClick = (suggestion: string) => {
    setMessageText(suggestion + ' ');
    setCommandSuggestions([]);
  };

  // Sidebar handlers
  const handleSidebarOpen = () => setSidebarVisible(true);
  const handleSidebarClose = () => setSidebarVisible(false);
  const handleChannelSelect = (channel: string) => {
    setCurrentChannel(channel);
    setSelectedPeer(null); // Switch to channel mode
    setSidebarVisible(false);
    joinChannel(channel);
  };
  const handleChannelLeave = (channel: string) => {
    leaveChannel(channel);
    if (currentChannel === channel) setCurrentChannel(null);
  };
  const handlePeerSelect = (peer: string) => {
    setSelectedPeer(peer); // Switch to DM mode
    setCurrentChannel(null);
    setSidebarVisible(false);
    connectToPeer(peer);
  };

  // Prepare messages for display
  let messagesToShow: ChatMessage[] = [];
  if (selectedPeer) {
    // DM mode
    messagesToShow = dmMessages.map((m, i) => ({ id: `dm-${i}`, sender: m.from, timestamp: Date.now(), content: m.content }));
  } else if (currentChannel) {
    // Channel mode
    messagesToShow = channelMessages.map((m, i) => ({ id: `ch-${i}`, sender: m.sender, timestamp: Date.now(), content: m.content }));
  }

  useEffect(() => {
    joinChannel("general");
    setCurrentChannel("general");
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <ChatHeader
        nickname={nickname}
        onNicknameChange={setNickname}
        peerCount={selectedPeer ? 1 : channels.length}
        currentChannel={currentChannel || undefined}
        selectedPrivatePeer={selectedPeer || undefined}
        onSidebarToggle={handleSidebarOpen}
      />
      <View style={styles.flex1}>
        <MessageList messages={messagesToShow} currentUserNickname={nickname} />
      </View>
      {/* Show connection logs only in DM mode */}
      {selectedPeer && (
        <View style={{ maxHeight: 120, backgroundColor: '#222', padding: 8 }}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Connection Logs:</Text>
          <View style={{ maxHeight: 100 }}>
            {logs.slice(-5).map((log, i) => (
              <Text key={i} style={{ color: '#fff', fontSize: 12 }}>{log}</Text>
            ))}
          </View>
        </View>
      )}
      <MessageInput
        value={messageText}
        onValueChange={handleInputChange}
        onSend={handleSend}
        nickname={nickname}
        commandSuggestions={commandSuggestions}
        onSuggestionClick={handleSuggestionClick}
      />
      <Sidebar
        visible={sidebarVisible}
        onClose={handleSidebarClose}
        channels={channels}
        currentChannel={currentChannel || undefined}
        onChannelSelect={handleChannelSelect}
        onChannelLeave={handleChannelLeave}
        peers={rtcPeers}
        onPeerSelect={handlePeerSelect}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
  },
  flex1: {
    flex: 1,
  },
});

export default ChatScreen; 