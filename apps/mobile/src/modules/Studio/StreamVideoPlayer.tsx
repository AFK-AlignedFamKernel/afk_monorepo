import {Video} from 'expo-av';
import React, {useEffect, useRef} from 'react';
import {Platform, View} from 'react-native';

import {useStyles} from '../../hooks';
import {PictureInPicture} from './PictureInPicture';
import stylesheet from './styles';

// Import RTCView for mobile
let RTCView: any;
if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  RTCView = require('react-native-webrtc').RTCView;
}

// Streamer component - handles camera and screen sharing for streamer.
export const StreamerVideoView = React.memo(
  ({
    cameraStream,
    isScreenSharing,
    screenStream,
  }: {
    isScreenSharing: boolean;
    cameraStream: MediaStream | any;
    screenStream: MediaStream | any;
  }) => {
    const styles = useStyles(stylesheet);
    const videoRef = useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
      if (Platform.OS === 'web' && videoRef.current) {
        const streamToUse = isScreenSharing ? screenStream : cameraStream;
        if (videoRef.current.srcObject !== streamToUse) {
          videoRef.current.srcObject = streamToUse;
        }
      }
    }, [isScreenSharing, cameraStream, screenStream]);

    if (Platform.OS === 'web') {
      return (
        <View style={styles.streamContainer}>
          <video ref={videoRef} autoPlay playsInline muted style={styles.mainVideoStream} />
          {isScreenSharing && <PictureInPicture stream={cameraStream as any} />}
        </View>
      );
    }

    // For mobile platforms
    const streamToUse = isScreenSharing ? screenStream : cameraStream;
    return (
      <View style={styles.streamContainer}>
        {streamToUse && <RTCView streamURL={streamToUse.toURL()} style={styles.mainVideoStream} />}
        {isScreenSharing && cameraStream && (
          <View style={styles.pipContainer}>
            <RTCView streamURL={cameraStream.toURL()} style={styles.pipVideo} />
          </View>
        )}
      </View>
    );
  },
);

StreamerVideoView.displayName = 'StreamerVideoView';

// Viewer component - just handles playback URL for viewers
export const ViewerVideoView = React.memo(({playbackUrl}: {playbackUrl: string | null}) => {
  const styles = useStyles(stylesheet);

  if (!playbackUrl) return null;

  if (Platform.OS === 'web') {
    return <video src={playbackUrl} autoPlay playsInline style={styles.videoStream} />;
  }

  return <Video source={{uri: playbackUrl}} shouldPlay isLooping style={styles.videoStream} />;
});

ViewerVideoView.displayName = 'ViewerVideoView';
