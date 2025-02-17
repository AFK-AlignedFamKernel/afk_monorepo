import {Feather} from '@expo/vector-icons';
import {useAuth} from 'afk_nostr_sdk';
import * as Clipboard from 'expo-clipboard';
import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';

import {BackIcon} from '../../assets/icons';
import {useSocketContext} from '../../context/SocketContext';
import {useStyles} from '../../hooks';
import {useToast} from '../../hooks/modals';
import {RecordedStream} from '../../types';
import {LiveChatView} from './LiveChat';
import StreamCompositionComponent from './stream';
import {useWebStream} from './stream/useWebStream';
import stylesheet from './styles';

export const ScreenRecordStream: React.FC<RecordedStream> = ({navigation, route}) => {
  const {publicKey} = useAuth();

  const streamKey = route?.params.streamId; //Stream Key will be the event Id
  const streamerUserId = publicKey;

  const {socketRef, isConnected} = useSocketContext();
  const {showToast} = useToast();
  const isStreamer = true;
  const styles = useStyles(stylesheet);
  const {isChatOpen, setNewMessage, newMessage, setIsChatOpen, playbackUrl} = useWebStream({
    socketRef,
    isStreamer,
    streamKey,
    streamerUserId,
    isConnected,
  });

  const handleCopy = async () => {
    await Clipboard.setStringAsync(playbackUrl ? playbackUrl : '');
    showToast({type: 'info', title: 'Copied to clipboard'});
  };

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

      <StreamCompositionComponent
        socketRef={socketRef}
        streamKey={streamKey}
        streamerUserId={streamerUserId}
        isStreamer
        toggleChat={() => setIsChatOpen(!isChatOpen)}
        recordingUrl={}
      />

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
