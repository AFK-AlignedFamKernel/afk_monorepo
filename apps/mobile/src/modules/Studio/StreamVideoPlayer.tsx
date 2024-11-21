// import {Video} from 'expo-av';
import {ResizeMode, Video} from 'expo-av';
import React from 'react';
import {Platform, View} from 'react-native';

import {useStyles} from '../../hooks';
import stylesheet from './styles';

// Import RTCView for mobile
let RTCView: any;
if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  RTCView = require('react-native-webrtc').RTCView;
}

// Viewer component - just handles playback URL for viewers
export const ViewerVideoView = React.memo(({playbackUrl}: {playbackUrl: string}) => {
  const videoRef = React.useRef(null);
  const styles = useStyles(stylesheet);

  const playbackConfig = {
    source: {
      uri: playbackUrl,
      // uri: 'https://stream-akamai.castr.com/5b9352dbda7b8c769937e459/live_2361c920455111ea85db6911fe397b9e/index.fmp4.m3u8',
      headers: {
        // Optional: Add any headers if required
      },
    },
    useNativeControls: true,
    resizeMode: ResizeMode.COVER,
  };

  return (
    <View style={styles.streamContainer}>
      <Video
        ref={videoRef}
        {...playbackConfig}
        style={{flex: 1, width: '100%', height: '30%'}}
        videoStyle={{
          flex: 1,
          width: '100%',
          height: '100%',
        }}
        onError={(error) => console.log('Video Error:', error)}
      />
    </View>
  );
});

ViewerVideoView.displayName = 'ViewerVideoView';
