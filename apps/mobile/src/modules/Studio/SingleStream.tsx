import {Feather, MaterialIcons} from '@expo/vector-icons';
import {useAuth} from 'afk_nostr_sdk';
import * as Clipboard from 'expo-clipboard';
import React from 'react';
import {Platform, Pressable, Text, TouchableOpacity, View} from 'react-native';

import {BackIcon} from '../../assets/icons';
import {useSocketContext} from '../../context/SocketContext';
import {useStyles} from '../../hooks';
import {useToast} from '../../hooks/modals';
import {WatchStream} from '../../types';
import {LiveChatView} from './LiveChat';
import {StreamerVideoView} from './StreamVideoPlayer';
import stylesheet from './styles';
import {useStream} from './useStream';

// Platform-specific import for RTCView
let RTCView: any;
if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  RTCView = require('react-native-webrtc').RTCView;
}

export const SingleStreamModuleView: React.FC<WatchStream> = ({navigation, route}) => {
  const {publicKey} = useAuth();

  const streamKey = route?.params.streamId; //Stream Key will be the event Id
  const streamerUserId = publicKey;

  const {socketRef, isConnected} = useSocketContext();
  const {showToast} = useToast();
  const isStreamer = true;
  const styles = useStyles(stylesheet);
  const {
    cameraStream,
    hasPermission,
    isAudioEnabled,
    isChatOpen,
    isScreenSharing,
    joinStream,
    isVideoEnabled,
    setNewMessage,
    stopStream,
    isStreaming,
    newMessage,
    setIsChatOpen,
    startStream,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    viewerCount,
    screenStream,
    playbackUrl,
  } = useStream({socketRef, isStreamer, streamKey, streamerUserId});

  const handleCopy = async () => {
    await Clipboard.setStringAsync(playbackUrl ? playbackUrl : '');
    showToast({type: 'info', title: 'Copied to clipboard'});
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
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('StreamStudio')}
        >
          <BackIcon width={24} height={24} stroke="gray" />
        </TouchableOpacity>

        {playbackUrl && (
          <TouchableOpacity onPress={handleCopy} style={styles.share_button}>
            <Feather
              name="share-2"
              size={18}
              color="white"
              style={{
                marginRight: 8,
              }}
            />
            <Text style={styles.share_buttonText}>Share Stream Link</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.videoContainer}>
        <StreamerVideoView
          cameraStream={cameraStream}
          isScreenSharing={isScreenSharing}
          screenStream={screenStream}
        />
        {isStreaming && (
          <View style={styles.overlay}>
            <View style={styles.liveIndicator}>
              <Text style={styles.liveText}>
                {isConnected ? 'LIVE' : 'NOT CONNECTED CHECK YOUR NETWORK CONNECTION'}
              </Text>
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
      </View>

      {isChatOpen && (
        <LiveChatView
          eventId={route?.params.streamId}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          setIsChatOpen={() => setIsChatOpen(!isChatOpen)}
        />
      )}
    </View>
  );
};
