import {NostrEvent} from '@nostr-dev-kit/ndk';
import {useNavigation} from '@react-navigation/native';
import {useProfile} from 'afk_nostr_sdk';
import {ResizeMode, Video} from 'expo-av';
import React, {useEffect, useState} from 'react';
import {Pressable, TouchableOpacity, View} from 'react-native';

import {BookmarkIcon, LikeIcon, RepostIcon} from '../../assets/icons';
import {useStyles} from '../../hooks';
import {MainStackNavigationProps} from '../../types';
import {Avatar} from '../Avatar';
import stylesheet from './styles';

const NostrVideo = ({item, shouldPlay}: {shouldPlay: boolean; item: NostrEvent}) => {
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

  useEffect(() => {
    const checkViewability = async () => {
      if (!video.current) return;

      try {
        const videoRef = video.current;
        const measureResult = await new Promise((resolve) => {
          resolve({ x: 0, y: 0, width: 0, height: 0 });
        });

        const { y, height } = measureResult as { x: number; y: number; width: number; height: number };
        const windowHeight = window.innerHeight;
        const isVisible = y >= 0 && y + height <= windowHeight;

        if (isVisible) {
          videoRef.playAsync();
        } else {
          videoRef.pauseAsync();
          videoRef.setPositionAsync(0);
        }
      } catch (error) {
        console.error('Error checking video viewability:', error);
      }
    };

    checkViewability();
  }, []);

  const extractVideoURL = (event: NostrEvent) => {

    const tags = event?.tags?.find((tag) => tag?.[0] === 'url' || tag?.[0] == "imeta" )?.[1] || '';

    if (tags.includes('url:')) {
      return tags.split('url:')[1].trim();
    } else if (tags.includes('etc:')) {
      return tags.split('etc:')[1].trim(); 
    }
    const urlMatch = tags.match(/(https?:\/\/[^\s]+\.(mp4|mov|avi|mkv|webm|gif))/i);
    if (urlMatch) {
      return urlMatch[0];
    }
    return tags
  };

  const handleProfile = () => {
    console.log('like');
    //todo: integrate hook
  };
  const handleProfilePress = (userId?: string) => {
    if (userId) {
      navigation.navigate('Profile', {publicKey: userId});
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


  // console.log("item",item)
  const videoURL = extractVideoURL(item);
  // console.log("uri", videoURL);
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
            source={{uri: videoURL}}
            style={styles.video}
            isLooping
            shouldPlay={true}
            resizeMode={ResizeMode.COVER}
            // useNativeControls={false}
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
            source={profile?.image ? {uri: profile.image} : require('../../assets/degen-logo.png')}
          />
          {/* <LikeIcon width={20} height={20} color="white" /> */}
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLike}>
          <LikeIcon width={20} height={20} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleRepost}>
          <RepostIcon width={20} height={20} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={{width: 15}} onPress={handleBookmark}>
          <BookmarkIcon width={15} height={20} color="white" />
        </TouchableOpacity>
      </View>
    </>
  );
};

export default NostrVideo;
