import {NostrEvent} from '@nostr-dev-kit/ndk';
import {ResizeMode, Video} from 'expo-av';
import React, {useEffect, useState} from 'react';
import {Pressable, TouchableOpacity, View} from 'react-native';

import {BookmarkIcon, LikeIcon, RepostIcon} from '../../assets/icons';
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
            source={{uri: extractVideoURL(item)}}
            style={styles.video}
            isLooping
            resizeMode={ResizeMode.COVER}
            useNativeControls={false}
            onPlaybackStatusUpdate={(status) => setStatus(() => status)}
          />
        </View>
      </Pressable>
      <View style={styles.actionsContainer}>
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
