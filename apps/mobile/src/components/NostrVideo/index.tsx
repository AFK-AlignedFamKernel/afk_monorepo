import { NDKEvent, NostrEvent } from '@nostr-dev-kit/ndk';
import { useNavigation } from '@react-navigation/native';
import { useAuth, useBookmark, useProfile, useReact, useReactions, useReplyNotes, useRepost } from 'afk_nostr_sdk';
import { ResizeMode, Video } from 'expo-av';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, TouchableOpacity, View } from 'react-native';

import { BookmarkIcon, LikeIcon, RepostIcon } from '../../assets/icons';
import { useNostrAuth, useStyles } from '../../hooks';
import { MainStackNavigationProps } from '../../types';
import { Avatar } from '../Avatar';
import stylesheet from './styles';
import { useQueryClient } from '@tanstack/react-query';
import { useSharedValue } from 'react-native-reanimated';
import { useTipModal, useToast } from '../../hooks/modals';
import { Icon } from '../Icon';
import { useIsDesktop } from '../../hooks/useIsDesktop';

const NostrVideo = ({ item, shouldPlay }: { shouldPlay: boolean; item: NostrEvent }) => {
  const video = React.useRef<Video | null>(null);
  const [status, setStatus] = useState<any>(null);
  const styles = useStyles(stylesheet);
  const isDesktop = useIsDesktop();
  const navigation = useNavigation<MainStackNavigationProps>();
  const { data: profile } = useProfile({ publicKey: item?.pubkey });
  const reactions = useReactions({ noteId: item?.id });
  const comments = useReplyNotes({ noteId: item?.id });

  const { showToast } = useToast();
  const { publicKey } = useAuth();
  const react = useReact();
  const queryClient = useQueryClient();
  const scale = useSharedValue(1);
  const userReaction = useReactions({ authors: [publicKey], noteId: item?.id });
  const repostMutation = useRepost({ event: item as NDKEvent });
  const { show: showTipModal } = useTipModal();

  const { bookmarkNote, removeBookmark } = useBookmark(publicKey);
  const [noteBookmarked, setNoteBookmarked] = useState(false);

  // const repostMutation = useRepost({ event: item });
  const { handleCheckNostrAndSendConnectDialog } = useNostrAuth();

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
          // videoRef.playAsync();
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

    const tags = event?.tags?.find((tag) => tag?.[0] === 'url' || tag?.[0] == "imeta")?.[1] || '';

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
      navigation.navigate('Profile', { publicKey: userId });
    }
  };

  const isLiked = useMemo(
    () =>
      Array.isArray(userReaction.data) &&
      userReaction.data[0] &&
      userReaction.data[0]?.content !== '-',
    [userReaction.data],
  );


  const handleLike = async () => {
    console.log('like');
    //todo: integrate hook
    if (!item?.id) return;

    await handleCheckNostrAndSendConnectDialog();

    await react.mutateAsync(
      { event: item as NDKEvent, type: isLiked ? 'dislike' : 'like' },
      {
        onSuccess: () => {
          if(!item?.id) return;
          queryClient.invalidateQueries({ queryKey: ['reactions', item?.id] });

          // scale.value = withSequence(
          //   withTiming(1.5, { duration: 100, easing: Easing.out(Easing.ease) }),
          //   withSpring(1, { damping: 6, stiffness: 200 }),
          // );
        },
      },
    );
  };


  const likes = useMemo(() => {
    if (!reactions.data) return 0;

    const likesCount = reactions.data.filter((reaction) => reaction.content !== '-').length;
    const dislikesCount = reactions.data.length - likesCount;
    return likesCount - dislikesCount;
  }, [reactions.data]);


  const handleRepost = async () => {
    if (!event) return;
    try {
      // @TODO fix
      await handleCheckNostrAndSendConnectDialog();

      const reposted = await repostMutation.mutateAsync();

      if (reposted) {
        showToast({ title: 'Post reposted successfully', type: 'success' });
      }
    } catch (error) {
      console.error('Repost error:', error);
      showToast({ title: 'Failed to repost', type: 'error' });
    }
  };

  const handleBookmark = async () => {
    if (!item) return;

    if(!item?.id) return;
    try {
      await handleCheckNostrAndSendConnectDialog();

      if (noteBookmarked) {
        await removeBookmark({ eventId: item?.id });
        showToast({ title: 'Post removed from bookmarks', type: 'success' });
      } else {
        await bookmarkNote({ event: item  as NDKEvent});
        showToast({ title: 'Post bookmarked successfully', type: 'success' });
      }
      // Invalidate the queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['search', { authors: [item?.pubkey] }] });
      queryClient.invalidateQueries({ queryKey: ['bookmarksWithNotes', item?.pubkey] });
      setNoteBookmarked((prev) => !prev);
    } catch (error) {
      console.error('Bookmark error:', error);
      showToast({ title: 'Failed to bookmark', type: 'error' });
    }
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
            source={{ uri: videoURL }}
            style={styles.video}
            isLooping
            shouldPlay={shouldPlay}
            resizeMode={ResizeMode.COVER}
            // useNativeControls={false}
            onPlaybackStatusUpdate={(status) => setStatus(() => status)}
            videoStyle={styles.innerVideo}
          />
        </View>
      </Pressable>
      <View style={[isDesktop ? styles.actionsContainer : styles.actionsContainerMobile]}>
        <TouchableOpacity onPress={() => handleProfilePress(item?.pubkey)}>
          <Avatar
            // size={asComment ? 40 : 50}
            size={40}
            source={profile?.image ? { uri: profile.image } : require('../../assets/degen-logo.png')}
          />
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
        <TouchableOpacity
          onPress={() => {
            if (!item) return;
            showTipModal(item as NDKEvent);
          }}
        >
          <Icon name="GiftIcon" size={15} title="Tip" />
        </TouchableOpacity>
      </View>
    </>
  );
};

export default NostrVideo;
