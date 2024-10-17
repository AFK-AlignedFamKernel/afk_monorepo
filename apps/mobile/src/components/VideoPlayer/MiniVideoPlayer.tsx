import {Ionicons} from '@expo/vector-icons'; // Make sure to install @expo/vector-icons
import {ResizeMode, Video} from 'expo-av';
import React, {useRef, useState} from 'react';
import {Pressable, StyleSheet, View, ViewStyle} from 'react-native';

interface VideoPlayerProps {
  uri: string;

  customStyle?: ViewStyle;
}

const MiniVideoPlayer: React.FC<VideoPlayerProps> = ({uri, customStyle}) => {
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
    <View style={[styles.videoContainer, customStyle]}>
      <Video
        ref={videoRef}
        source={{uri}}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        shouldPlay={false}
        isLooping
      />
      <Pressable onPress={handlePlayPause} style={styles.controlsOverlay}>
        <Ionicons name={isPlaying ? 'pause' : 'play'} size={30} color="white" />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  videoContainer: {
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    overflow: 'hidden',
    aspectRatio: 16 / 9,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
});

export default MiniVideoPlayer;
