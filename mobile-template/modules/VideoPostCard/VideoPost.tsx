import {NDKEvent, NDKKind} from '@nostr-dev-kit/ndk';
import {useNavigation} from '@react-navigation/native';
import {useQueryClient} from '@tanstack/react-query';
import {
  useBookmark,
  useProfile,
  useReact,
  useReactions,
  useReplyNotes,
  useRepost,
} from 'afk_nostr_sdk';
// import { useAuth } from '../../store/auth';
import {useAuth} from 'afk_nostr_sdk';
import {useMemo, useState} from 'react';
import React from 'react';
import {ActivityIndicator, Pressable, View} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import {CommentIcon, LikeFillIcon, LikeIcon, RepostIcon} from '../../assets/icons';
import {Avatar, Icon, IconButton, Menu, Text} from '../../components';
import Badge from '../../components/Badge';
import MiniVideoPlayer from '../../components/VideoPlayer/MiniVideoPlayer';
import {useNostrAuth, useStyles, useTheme} from '../../hooks';
import {useTipModal, useToast} from '../../hooks/modals';
import {MainStackNavigationProps} from '../../types';
import {removeHashFn, shortenPubkey} from '../../utils/helpers';
import {getElapsedTimeStringFull} from '../../utils/timestamp';
import {ContentWithClickableHashtags} from '../PostCard';
import stylesheet from './styles';

export type PostProps = {
  asComment?: boolean;
  event?: NDKEvent;
  repostedEventProps?: string;
  isRepost?: boolean;
  isBookmarked?: boolean;
};

export const VideoPost: React.FC<PostProps> = ({
  asComment,
  event,
  repostedEventProps,
  isRepost,
  isBookmarked = false,
}) => {
  const repostedEvent = repostedEventProps ?? undefined;

  const {theme} = useTheme();
  const styles = useStyles(stylesheet);
  const {showToast} = useToast();

  const navigation = useNavigation<MainStackNavigationProps>();

  const {publicKey} = useAuth();
  const {show: showTipModal} = useTipModal();
  const {data: profile} = useProfile({publicKey: event?.pubkey});
  const reactions = useReactions({noteId: event?.id});
  const userReaction = useReactions({authors: [publicKey], noteId: event?.id});
  const comments = useReplyNotes({noteId: event?.id});
  const react = useReact();
  const queryClient = useQueryClient();
  const repostMutation = useRepost({event});
  const {bookmarkNote, removeBookmark} = useBookmark(publicKey);
  const [noteBookmarked, setNoteBookmarked] = useState(isBookmarked);
  const {handleCheckNostrAndSendConnectDialog} = useNostrAuth();

  const [menuOpen, setMenuOpen] = useState(false);

  const scale = useSharedValue(1);
  const [isContentExpanded, setIsContentExpanded] = useState(false);

  const toggleExpandedContent = () => {
    setIsContentExpanded((prev) => !prev);
  };

  const isLiked = useMemo(
    () =>
      Array.isArray(userReaction.data) &&
      userReaction.data[0] &&
      userReaction.data[0]?.content !== '-',
    [userReaction.data],
  );

  const likes = useMemo(() => {
    if (!reactions.data) return 0;

    const likesCount = reactions.data.filter((reaction) => reaction.content !== '-').length;
    const dislikesCount = reactions.data.length - likesCount;
    return likesCount - dislikesCount;
  }, [reactions.data]);

  const hashTags = useMemo(() => {
    return event?.tags?.filter((tag) => tag[0] === 't').map((tag) => tag[1]) || [];
  }, [event?.tags]);

  //Video MetaData
  const videoMetadata = useMemo(() => {
    const imetaTag = event?.tags?.find((tag) => tag[0] === 'imeta') || [];

    const dimensions = imetaTag.find((item) => item.startsWith('dim'))?.split(' ')[1] || '';
    const url = imetaTag.find((item) => item.startsWith('url'))?.split(' ')[1] || '';
    const mimeType = imetaTag.find((item) => item.startsWith('m'))?.split(' ')[1] || '';
    const images =
      imetaTag.filter((item) => item.startsWith('image')).map((item) => item.split(' ')[1]) || [];
    const fallbacks =
      imetaTag.filter((item) => item.startsWith('fallback')).map((item) => item.split(' ')[1]) ||
      [];
    const service = imetaTag.find((item) => item.startsWith('service'))?.split(' ')[1] || '';

    return {dimensions, url, mimeType, images, fallbacks, service};
  }, [event?.tags]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }));

  const handleProfilePress = (userId?: string) => {
    if (userId) {
      navigation.navigate('Profile', {publicKey: userId});
    }
  };

  const handleNavigateToPostDetails = () => {
    if (!event?.id) return;
    navigation.navigate('PostDetail', {postId: event?.id, post: event});
  };

  const toggleLike = async () => {
    if (!event?.id) return;

    await handleCheckNostrAndSendConnectDialog();

    await react.mutateAsync(
      {event, type: isLiked ? 'dislike' : 'like'},
      {
        onSuccess: () => {
          queryClient.invalidateQueries({queryKey: ['reactions', event?.id]});

          scale.value = withSequence(
            withTiming(1.5, {duration: 100, easing: Easing.out(Easing.ease)}),
            withSpring(1, {damping: 6, stiffness: 200}),
          );
        },
      },
    );
  };

  const handleRepost = async () => {
    if (!event) return;
    try {
      await handleCheckNostrAndSendConnectDialog();

      await repostMutation.mutateAsync();
      showToast({title: 'Post reposted successfully', type: 'success'});
    } catch (error) {
      console.error('Repost error:', error);
      showToast({title: 'Failed to repost', type: 'error'});
    }
  };

  const handleBookmark = async () => {
    if (!event) return;
    try {
      await handleCheckNostrAndSendConnectDialog();

      if (noteBookmarked) {
        await removeBookmark({eventId: event.id});
        showToast({title: 'Post removed from bookmarks', type: 'success'});
      } else {
        await bookmarkNote({event});
        showToast({title: 'Post bookmarked successfully', type: 'success'});
      }
      // Invalidate the queries to refetch data
      queryClient.invalidateQueries({queryKey: ['search', {authors: [event.pubkey]}]});
      queryClient.invalidateQueries({queryKey: ['bookmarksWithNotes', event.pubkey]});
      setNoteBookmarked((prev) => !prev);
    } catch (error) {
      console.error('Bookmark error:', error);
      showToast({title: 'Failed to bookmark', type: 'error'});
    }
  };

  const content = event?.content || '';
  const truncatedContent = content.length > 200 ? `${content.slice(0, 200)}...` : content;

  const handleHashtagPress = (hashtag: string) => {
    const tag = removeHashFn(hashtag);
    navigation.navigate('Tags', {tagName: tag});
  };

  return (
    <View style={styles.container}>
      {/* {repostedEvent ||
        event?.kind == NDKKind.Repost ||
        (isRepost && (
          <View style={styles.repost}>
            <RepostIcon color={theme.colors.textLight} height={18} />
            <Text color="textLight">Reposted</Text>
          </View>
        ))} */}

      <View style={styles.info}>
        <View style={styles.infoUser}>
          <Pressable onPress={() => handleProfilePress(event?.pubkey)}>
            <Avatar
              size={30}
              source={
                profile?.image ? {uri: profile.image} : require('../../assets/degen-logo.png')
              }
            />
          </Pressable>

          <Pressable style={styles.infoProfile} onPress={handleNavigateToPostDetails}>
            <Text
              weight="semiBold"
              color="textSecondary"
              fontSize={asComment ? 13 : 15}
              lineHeight={20}
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              {profile?.displayName ??
                profile?.name ??
                profile?.nip05 ??
                shortenPubkey(event?.pubkey)}
            </Text>

            <View style={styles.infoDetails}>
              {/* {(profile?.nip05 || profile?.name) && (
                <>
                  <Text
                    color="textLight"
                    fontSize={11}
                    lineHeight={16}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    @{profile?.nip05 ?? profile.name}
                  </Text>

                  <View style={styles.infoDetailsDivider} />
                </>
              )} */}

              <View style={styles.infoDetailsDivider} />

              <Text color="textSecondary" fontSize={12} lineHeight={16}>
                {getElapsedTimeStringFull((event?.created_at ?? Date.now()) * 1000)}
              </Text>
            </View>
          </Pressable>
        </View>

        <Pressable onPress={toggleLike}>
          <View style={styles.infoLikes}>
            <Animated.View style={animatedIconStyle}>
              {isLiked ? (
                <LikeFillIcon height={15} color={theme.colors.greenLike} />
              ) : (
                <LikeIcon height={15} color={theme.colors.greenLike} />
              )}
            </Animated.View>

            {likes > 0 && (
              <Text color="textSecondary" fontSize={11} lineHeight={16}>
                {likes}
              </Text>
            )}
          </View>
        </Pressable>
      </View>

      <View style={styles.innerContainer}>
        <Pressable style={{width: '80%'}} onPress={handleNavigateToPostDetails}>
          <ContentWithClickableHashtags
            content={isContentExpanded ? content : truncatedContent}
            onHashtagPress={handleHashtagPress}
          />

          {content.length > 200 && (
            <Pressable onPress={toggleExpandedContent}>
              <Text style={styles.seeMore}>{isContentExpanded ? 'See less' : 'See more...'}</Text>
            </Pressable>
          )}
        </Pressable>

        {!content ? (
          <MiniVideoPlayer
            customStyle={{
              height: 300,
              width: '100%',
            }}
            uri={videoMetadata?.url}
          />
        ) : (
          <MiniVideoPlayer
            customStyle={{
              height: 100,
              width: 150,
            }}
            uri={videoMetadata?.url}
          />
        )}
      </View>

      {!asComment && (
        <>
          <View style={styles.hashTagsContainer}>
            {hashTags.map((hashTag, index) => (
              <Pressable onPress={() => handleHashtagPress(hashTag)} key={index}>
                <Badge value={`#${hashTag}`} />
              </Pressable>
            ))}
          </View>
          <View style={styles.footer}>
            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'baseline',
                gap: 30,
              }}
            >
              <Pressable onPress={handleNavigateToPostDetails}>
                <View style={styles.footerComments}>
                  <CommentIcon height={15} color={theme.colors.textSecondary} />

                  <Text color="textSecondary" fontSize={11} lineHeight={16}>
                    {comments.data?.pages.flat().length}
                  </Text>
                </View>
              </Pressable>

              <Pressable onPress={handleRepost} disabled={repostMutation.isPending}>
                <Icon name="RepostIcon" size={15} title="Repost" />
                {/* todo add number of reposts */}
                {repostMutation.isPending && <ActivityIndicator size="small" />}
              </Pressable>

              <Pressable
                onPress={() => {
                  if (!event) return;
                  showTipModal(event);
                }}
              >
                <Icon name="GiftIcon" size={15} title="Tip" />
              </Pressable>

              <Pressable onPress={() => {}}>
                <Icon name="ShareIcon" size={15} title="Share" />
              </Pressable>

              {/* <Pressable onPress={handleBookmark}>
                <Icon
                  name={noteBookmarked ? 'BookmarkFillIcon' : 'BookmarkIcon'}
                  size={20}
                  title={noteBookmarked ? 'Bookmarked' : 'Bookmark'}
                />
              </Pressable> */}
            </View>
          </View>
        </>
      )}
    </View>
  );
};
