import {ResizeMode, Video} from 'expo-av';
import React, {useRef, useState} from 'react';
import {Dimensions, Pressable, StyleSheet} from 'react-native';

const VideoPlayer = ({uri}: {uri: string}) => {
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayPause = async () => {
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <Pressable onPress={handlePlayPause} style={styles.videoContainer}>
      <Video
        ref={videoRef}
        source={{
          uri,
        }}
        videoStyle={styles.video}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        shouldPlay={false} // By default, video won't play
        isLooping
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  videoContainer: {
    width: '100%',
    height: Dimensions.get('window').width * (9 / 16),
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  video: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    overflow: 'hidden',
  },
});

export default VideoPlayer;
