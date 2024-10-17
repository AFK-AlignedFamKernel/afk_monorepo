import { NostrEvent } from '@nostr-dev-kit/ndk';
import { ResizeMode, Video } from 'expo-av';
import React, { useEffect, useState } from 'react';
import { Pressable, TouchableOpacity, View } from 'react-native';

import { BookmarkIcon, LikeIcon, RepostIcon } from '../../assets/icons';
import { useStyles } from '../../hooks';
import stylesheet from './styles';
import { MainStackNavigationProps } from '../../types';
import { useNavigation } from '@react-navigation/native';
import { Avatar } from '../Avatar';
import { useProfile } from 'afk_nostr_sdk';

const NostrVideo = ({ item, shouldPlay }: { shouldPlay: boolean; item: NostrEvent }) => {
  const video = React.useRef<Video | null>(null);
  const [status, setStatus] = useState<any>(null);
  const styles = useStyles(stylesheet);
  const navigation = useNavigation<MainStackNavigationProps>();
  const {data: profile} = useProfile({publicKey: item?.pubkey});

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
    const urlTag = event?.tags?.find((tag) => tag?.[0] === 'url');
    if (urlTag) {
      const ipfsHash = urlTag[1].replace('ipfs://', '');
      return `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
    }
    return '';
  };

  const handleProfile = () => {
    console.log('like');
    //todo: integrate hook
  };
  const handleProfilePress = (userId?: string) => {
    if (userId) {
      navigation.navigate('Profile', { publicKey: userId });
    }
  };

  const handleLike = () => {
    console.log('like');
    //todo: integrate hook
  };

  const handleRepost = () => {
    console.log('like');
    //todo: integrate hook
  };

  const handleBookmark = () => {
    console.log('like');
    //todo: integrate hook
  };

  return (
    <>
      <Pressable
        onPress={() =>
          status.isPlaying ? video.current?.pauseAsync() : video.current?.playAsync()
        }
      >
        <View style={styles.videoContainer}>
          <Video
            ref={video}
            source={{ uri: extractVideoURL(item) }}
            style={styles.video}
            isLooping
            resizeMode={ResizeMode.COVER}
            useNativeControls={false}
            onPlaybackStatusUpdate={(status) => setStatus(() => status)}
            videoStyle={styles.innerVideo}
          />
        </View>
      </Pressable>
      <View style={styles.actionsContainer}>
        <TouchableOpacity onPress={() => handleProfilePress(item?.pubkey)}>
          <Avatar
            // size={asComment ? 40 : 50}
            size={40}
            source={
              profile?.image ? { uri: profile.image } : require('../../assets/degen-logo.png')
            }
          />
          {/* <LikeIcon width={20} height={20} color="white" /> */}
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLike}>
          <LikeIcon width={20} height={20} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleRepost}>
          <RepostIcon width={20} height={20} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={{ width: 15 }} onPress={handleBookmark}>
          <BookmarkIcon width={15} height={20} color="white" />
        </TouchableOpacity>
      </View>
    </>
  );
};

export default NostrVideo;
