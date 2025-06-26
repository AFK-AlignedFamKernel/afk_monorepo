import {ResizeMode, Video} from 'expo-av';
import React, {useRef} from 'react';
import {Platform, Text, View} from 'react-native';

import {useStyles} from '../../hooks';
import {useHLSPlayer} from './stream/useHlsPlayer';
import stylesheet from './styles';

export const ViewerVideoView = React.memo(({playbackUrl}: {playbackUrl: string}) => {
  const styles = useStyles(stylesheet);
  const videoRef = useRef(null);
  const {error, status, onPlaybackStatusUpdate} = useHLSPlayer(videoRef, playbackUrl);

  if (error) {
    return (
      <View style={styles.streamContainer}>
        <Text>Error: {error.message}</Text>
      </View>
    );
  }

  if (Platform.OS === 'web') {
    return (
      <View style={styles.streamContainer}>
        <video
          ref={videoRef}
          style={{
            flex: 1,
            width: '100%',
            height: '100%',
          }}
          controls
          playsInline
        />
      </View>
    );
  }

  return (
    <View style={styles.streamContainer}>
      <Video
        ref={videoRef}
        style={{
          flex: 1,
          width: '100%',
          height: '100%',
        }}
        useNativeControls
        resizeMode={ResizeMode.CONTAIN}
        isLooping
        onPlaybackStatusUpdate={onPlaybackStatusUpdate}
      />
    </View>
  );
});

ViewerVideoView.displayName = 'ViewerVideoView';
