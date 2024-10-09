import {NostrEvent} from '@nostr-dev-kit/ndk';
import {ResizeMode, Video} from 'expo-av';
import React, {useEffect, useState} from 'react';
import {Pressable, View} from 'react-native';

import {useStyles} from '../../hooks';
import stylesheet from './styles';

const NostrVideo = ({item, shouldPlay}: {shouldPlay: boolean; item: NostrEvent}) => {
  const video = React.useRef<Video | null>(null);
  const [status, setStatus] = useState<any>(null);
  const styles = useStyles(stylesheet);

  useEffect(() => {
    if (!video.current) return;

    if (shouldPlay) {
      video.current.playAsync();
    } else {
      video.current.pauseAsync();
      video.current.setPositionAsync(0);
    }
  }, [shouldPlay]);

  const extractVideoURL = (event: NostrEvent) => {
    return event?.tags?.find((tag) => tag?.[0] === 'url')?.[1] || '';
  };

  return (
    <Pressable
      onPress={() => (status.isPlaying ? video.current?.pauseAsync() : video.current?.playAsync())}
    >
      <View style={styles.videoContainer}>
        <Video
          ref={video}
          source={{uri: extractVideoURL(item)}}
          style={styles.video}
          isLooping
          resizeMode={ResizeMode.COVER}
          useNativeControls={false}
          onPlaybackStatusUpdate={(status) => setStatus(() => status)}
        />
      </View>
    </Pressable>
  );
};

export default NostrVideo;
