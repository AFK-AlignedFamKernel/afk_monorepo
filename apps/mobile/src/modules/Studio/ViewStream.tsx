import {useAuth} from 'afk_nostr_sdk';
import React from 'react';
import {Platform, Text, View} from 'react-native';

import {useSocketContext} from '../../context/SocketContext';
import {useStyles} from '../../hooks';
import {ViewStreamGuest} from '../../types';
import {LiveChatView} from './LiveChat';
import {ViewerVideoView} from './StreamVideoPlayer';
import stylesheet from './styles';
import {useStream} from './useStream';

// Platform-specific import for RTCView
let RTCView: any;
if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  RTCView = require('react-native-webrtc').RTCView;
}

export const ViewStreamModuleView: React.FC<ViewStreamGuest> = ({route}) => {
  const {publicKey} = useAuth();
  const isStreamer = false;
  const streamKey = route?.params.streamId; //Stream Key will be the event Id
  const streamerUserId = publicKey;

  const styles = useStyles(stylesheet);
  const {socketRef, isConnected} = useSocketContext();
  const {
    isChatOpen,
    setNewMessage,
    newMessage,
    setIsChatOpen,
    playbackUrl,
    isStreaming,
    viewerCount,
  } = useStream({socketRef, streamerUserId, streamKey, isStreamer});

  return (
    <View style={styles.container}>
      <View style={styles.videoContainer}>
        <ViewerVideoView playbackUrl={playbackUrl} />
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
