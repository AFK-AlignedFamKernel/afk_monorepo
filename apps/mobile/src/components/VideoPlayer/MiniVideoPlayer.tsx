import {Ionicons} from '@expo/vector-icons';
import {AVPlaybackStatus, ResizeMode, Video} from 'expo-av';
import React, {useEffect, useRef, useState} from 'react';
import {Modal, Pressable, SafeAreaView, StyleSheet, View, ViewStyle} from 'react-native';

interface VideoPlayerProps {
  uri: string;
  customStyle?: ViewStyle;
}

export default function MiniVideoPlayer({uri, customStyle}: VideoPlayerProps) {
  const miniVideoRef = useRef<Video>(null);
  const modalVideoRef = useRef<Video>(null);
  const [isMiniPlaying, setIsMiniPlaying] = useState(false);
  const [isModalPlaying, setIsModalPlaying] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleMiniPlayPause = async () => {
    if (miniVideoRef.current) {
      if (isMiniPlaying) {
        await miniVideoRef.current.pauseAsync();
      } else {
        await miniVideoRef.current.playAsync();
      }
      setIsMiniPlaying(!isMiniPlaying);
    }
  };

  const handleModalPlayPause = async () => {
    if (modalVideoRef.current) {
      if (isModalPlaying) {
        await modalVideoRef.current.pauseAsync();
      } else {
        await modalVideoRef.current.playAsync();
      }
      setIsModalPlaying(!isModalPlaying);
    }
  };

  const handlePreview = async () => {
    if (miniVideoRef.current && isMiniPlaying) {
      await miniVideoRef.current.pauseAsync();
      setIsMiniPlaying(false);
    }
    setIsModalVisible(true);
  };

  const handleCloseModal = async () => {
    if (modalVideoRef.current && isModalPlaying) {
      await modalVideoRef.current.pauseAsync();
      setIsModalPlaying(false);
    }
    setIsModalVisible(false);
  };

  useEffect(() => {
    if (isModalVisible && modalVideoRef.current) {
      modalVideoRef.current.playFromPositionAsync(0);
    }
  }, [isModalVisible]);

  const onMiniPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsMiniPlaying(status.isPlaying);
    }
  };

  const onModalPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsModalPlaying(status.isPlaying);
    }
  };

  return (
    <View style={[styles.videoContainer, customStyle]}>
      <Video
        ref={miniVideoRef}
        source={{uri}}
        style={styles.video}
        videoStyle={styles.video}
        resizeMode={ResizeMode.COVER}
        shouldPlay={false}
        isLooping
        onPlaybackStatusUpdate={onMiniPlaybackStatusUpdate}
      />
      <View style={styles.controlsOverlay}>
        <Pressable onPress={handleMiniPlayPause} style={styles.controlButton}>
          <Ionicons name={isMiniPlaying ? 'pause' : 'play'} size={20} color="white" />
        </Pressable>
      </View>
      <Pressable onPress={handlePreview} style={styles.previewButton}>
        <Ionicons name="expand" size={12} color="white" />
      </Pressable>
      <Modal
        animationType="fade"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={handleCloseModal}
      >
        <SafeAreaView style={styles.modalContainer}>
          <Pressable onPress={handleModalPlayPause} style={styles.modalContent}>
            <Video
              ref={modalVideoRef}
              source={{uri}}
              videoStyle={styles.video}
              style={styles.fullScreenVideo}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay={false}
              isLooping
              onPlaybackStatusUpdate={onModalPlaybackStatusUpdate}
            />
            <Pressable onPress={handleCloseModal} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="white" />
            </Pressable>
          </Pressable>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  videoContainer: {
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
    overflow: 'hidden',
    width: '100%',
    height: '100%',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButton: {
    padding: 10,
  },
  previewButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    padding: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    maxWidth: 700,
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: 'black',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  fullScreenVideo: {
    width: '100%',
    height: '100%',
  },
  modalControls: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
});
