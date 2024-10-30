import {Feather, MaterialIcons} from '@expo/vector-icons';
import React from 'react';
import {Platform, Pressable, Text, View} from 'react-native';
import {ScrollView, TextInput} from 'react-native';

import {useSocketContext} from '../../context/SocketContext';
import {useStyles} from '../../hooks';
import {StreamStudio} from '../../types';
import {PictureInPicture} from './PictureInPicture';
import stylesheet from './styles';
import {useStream} from './useStream';

// Platform-specific import for RTCView
let RTCView: any;
if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  RTCView = require('react-native-webrtc').RTCView;
}

export const StudioModuleView: React.FC<StreamStudio> = ({navigation}) => {
  const {socketRef} = useSocketContext();
  const isStreamer = true;
  const styles = useStyles(stylesheet);
  const {
    cameraStream,
    handleSendMessage,
    hasPermission,
    isAudioEnabled,
    isChatOpen,
    isScreenSharing,
    joinStream,
    isVideoEnabled,
    setNewMessage,
    stopStream,
    isStreaming,
    messages,
    newMessage,
    setIsChatOpen,
    startStream,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    viewerCount,
    screenStream,
    publicKey,
  } = useStream({socketRef, isStreamer});

  const renderStream = () => {
    if (isStreamer) {
      if (Platform.OS === 'web') {
        return (
          <View style={styles.streamContainer}>
            <video
              ref={(video) => {
                if (video) video.srcObject = isScreenSharing ? screenStream : cameraStream;
              }}
              autoPlay
              playsInline
              muted
              style={styles.mainVideoStream}
            />

            {/* Enhanced Picture-in-Picture camera view */}
            {isScreenSharing && <PictureInPicture stream={cameraStream as any} />}
          </View>
        );
      }
      return null; // Placeholder for native camera view
    }

    return null;
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text>Requesting permissions...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text>No access to camera</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.videoContainer}>
        {renderStream()}
        {isStreaming && (
          <View style={styles.overlay}>
            <View style={styles.liveIndicator}>
              <Text style={styles.liveText}>LIVE</Text>
            </View>
            <View style={styles.viewerContainer}>
              <Text style={styles.viewerCount}>{viewerCount} viewers</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.controls}>
        <Pressable
          style={[styles.button, isStreaming ? styles.buttonDestructive : styles.buttonPrimary]}
          onPress={() => {
            if (isStreaming) {
              stopStream();
            } else if (isStreamer) {
              startStream();
              console.log('Starting stream...');
            } else {
              joinStream();
            }
          }}
        >
          <Text style={styles.buttonText}>
            {isStreaming ? 'End' : isStreamer ? 'Start Stream' : 'Join Stream'}
          </Text>
        </Pressable>

        <Pressable style={styles.iconButton} onPress={toggleVideo}>
          <MaterialIcons
            style={styles.actionButtonText}
            name={isVideoEnabled ? 'videocam' : 'videocam-off'}
            size={24}
          />
        </Pressable>

        <Pressable style={styles.iconButton} onPress={toggleScreenShare}>
          <MaterialIcons
            name={!isScreenSharing ? 'screen-share' : 'stop-screen-share'}
            size={20}
            style={styles.actionButtonText}
          />
        </Pressable>

        <Pressable style={styles.iconButton} onPress={toggleAudio}>
          <MaterialIcons
            name={isAudioEnabled ? 'mic' : 'mic-off'}
            size={24}
            style={styles.actionButtonText}
          />
        </Pressable>

        <Pressable style={styles.iconButton} onPress={() => setIsChatOpen(!isChatOpen)}>
          <Feather name="message-square" size={20} style={styles.actionButtonText} />
        </Pressable>

        {/* <Pressable
          style={styles.iconButton}
          onPress={() => navigation.navigate('WatchStream', {streamId: publicKey})}
        >
          <Feather name="eye" size={20} style={styles.actionButtonText} />
        </Pressable> */}
      </View>

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
