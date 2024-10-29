import {Feather} from '@expo/vector-icons';
import {Video} from 'expo-av';
import React from 'react';
import {Platform, Pressable, Text, View} from 'react-native';
import {ScrollView, TextInput} from 'react-native';

import {useSocketContext} from '../../context/SocketContext';
import {useStyles} from '../../hooks';
import {WatchStream} from '../../types';
import stylesheet from './styles';
import {useStream} from './useStream';

// Platform-specific import for RTCView
let RTCView: any;
if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  RTCView = require('react-native-webrtc').RTCView;
}

export const ViewStreamModuleView: React.FC<WatchStream> = () => {
  const isStreamer = false;

  const styles = useStyles(stylesheet);
  const {socketRef} = useSocketContext();
  const {
    handleSendMessage,
    isChatOpen,
    remoteStream,
    setNewMessage,
    messages,
    newMessage,
    playbackUrl,
    setIsChatOpen,
  } = useStream({socketRef, isStreamer});

  const renderStream = () => {
    if (!isStreamer && (remoteStream || playbackUrl)) {
      if (Platform.OS === 'web') {
        return remoteStream ? (
          <video
            ref={(ref) => {
              if (ref) ref.srcObject = remoteStream;
            }}
            autoPlay
            playsInline
            style={styles.videoStream}
          />
        ) : (
          <video src={playbackUrl || undefined} autoPlay playsInline style={styles.videoStream} />
        );
      }

      return remoteStream ? (
        <RTCView streamURL={remoteStream.toURL()} style={styles.videoStream} />
      ) : (
        <Video source={{uri: playbackUrl || ''}} shouldPlay isLooping style={styles.videoStream} />
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      <View style={styles.videoContainer}>{renderStream()}</View>

      {isChatOpen && (
        <View style={styles.chatContainer}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatTitle}>Live Chat</Text>
            <Pressable onPress={() => setIsChatOpen(false)}>
              <Feather name="x" size={20} style={styles.actionButtonText} />
            </Pressable>
          </View>

          <ScrollView style={styles.chatMessages}>
            {messages.map((message: any) => (
              <View key={message.id} style={styles.messageContainer}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{message.sender[0]}</Text>
                </View>
                <View style={styles.messageContent}>
                  <Text style={styles.messageSender}>{message.sender}</Text>
                  <Text style={styles.messageText}>{message.text}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.chatInputContainer}>
            <TextInput
              style={styles.chatInput}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Type a message..."
              placeholderTextColor="#666"
            />
            <Pressable style={styles.sendButton} onPress={handleSendMessage}>
              <Text style={styles.sendButtonText}>Send</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
};
