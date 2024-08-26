import { NDKEvent } from '@nostr-dev-kit/ndk';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { useProfile, useReact, useReactions, useReplyNotes, useBookmark, useAuth, useRepost } from 'afk_nostr_sdk';

import { useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { CommentIcon, LikeFillIcon, LikeIcon, BookmarkFillIcon, RepostIcon, RepostFillIcon, BookmarkIcon } from '../../assets/icons';
import { Avatar, Icon, IconButton, Menu, Text } from '../../components';
import { useStyles, useTheme } from '../../hooks';
import { useTipModal, useToast } from '../../hooks/modals';
import { MainStackNavigationProps } from '../../types';
import { getImageRatio, shortenPubkey } from '../../utils/helpers';
import { getElapsedTimeStringFull } from '../../utils/timestamp';
import stylesheet from './styles';

export type PostProps = {
  asComment?: boolean;
  event?: NDKEvent;
};

export const Post: React.FC<PostProps> = ({ asComment, event }) => {
  const { theme } = useTheme();
  const styles = useStyles(stylesheet);
  const { showToast } = useToast();

  const navigation = useNavigation<MainStackNavigationProps>();

  const [dimensionsMedia, setMediaDimensions] = useState([250, 300]);
  const { publicKey } = useAuth();
  const { show: showTipModal } = useTipModal();
  const { data: profile } = useProfile({ publicKey: event?.pubkey });
  const reactions = useReactions({ noteId: event?.id });
  const userReaction = useReactions({ authors: [publicKey], noteId: event?.id });
  const comments = useReplyNotes({ noteId: event?.id });
  const react = useReact();
  const queryClient = useQueryClient();
  const repostMutation = useRepost({ event });
  const bookmarkMutation = useBookmark({ event });

  const [menuOpen, setMenuOpen] = useState(false);

  const likeScale = useSharedValue(1);
  const repostScale = useSharedValue(1);
  const bookmarkScale = useSharedValue(1);
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

  const isBookmarked = useMemo(() => {
    const bookmarks = queryClient.getQueryData(['bookmarks', event?.id, publicKey]);
    return Array.isArray(bookmarks) && bookmarks.length > 0;
  }, [queryClient, event?.id, publicKey]);

  const isReposted = useMemo(() => {
    const reposts = queryClient.getQueryData(['reposts', event?.id, publicKey]);
    return Array.isArray(reposts) && reposts.length > 0;
  }, [queryClient, event?.id, publicKey]);

  const postSource = useMemo(() => {
    if (!event?.tags) return;

    const imageTag = event.tags.find((tag) => tag[0] === 'image');
    if (!imageTag) return;
    let dimensions = [250, 300];
    if (imageTag[2]) {
      dimensions = imageTag[2].split('x').map(Number);
      setMediaDimensions(dimensions);
    }
    return { uri: imageTag[1], width: dimensions[0], height: dimensions[1] };
  }, [event?.tags]);

  const animatedLikeIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: likeScale.value }],
  }));

  const animatedRepostIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: repostScale.value }],
  }));

  const animatedBookmarkIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bookmarkScale.value }],
  }));

  const handleProfilePress = (userId?: string) => {
    if (userId) {
      navigation.navigate('Profile', { publicKey: userId });
    }
  };

  const handleNavigateToPostDetails = () => {
    if (!event?.id) return;
    navigation.navigate('PostDetail', { postId: event?.id, post: event });
  };

  const toggleLike = async () => {
    if (!event?.id) return;

    await react.mutateAsync(
      { event, type: isLiked ? 'dislike' : 'like' },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['reactions', event?.id] });

          likeScale.value = withSequence(
            withTiming(1.5, { duration: 100, easing: Easing.out(Easing.ease) }),
            withSpring(1, { damping: 6, stiffness: 200 }),
          );
        },
      },
    );
  };

  const handleRepost = async () => {
    if (!event) return;
    try {
      await repostMutation.mutateAsync();
      repostScale.value = withSequence(
        withTiming(1.5, { duration: 100, easing: Easing.out(Easing.ease) }),
        withSpring(1, { damping: 6, stiffness: 200 }),
      );
      queryClient.invalidateQueries({ queryKey: ['reposts', event.id, publicKey] });
      showToast({ title: isReposted ? 'Repost removed' : 'Post reposted successfully', type: 'success' });
    } catch (error) {
      console.error('Repost error:', error);
      showToast({ title: 'Failed to repost', type: 'error' });
    }
  };

  const handleBookmark = async () => {
    if (!event) return;
    try {
      await bookmarkMutation.mutateAsync();
      bookmarkScale.value = withSequence(
        withTiming(1.5, { duration: 100, easing: Easing.out(Easing.ease) }),
        withSpring(1, { damping: 6, stiffness: 200 }),
      );
      queryClient.invalidateQueries({ queryKey: ['bookmarks', event.id, publicKey] });
      showToast({ title: isBookmarked ? 'Bookmark removed' : 'Post bookmarked successfully', type: 'success' });
    } catch (error) {
      console.error('Bookmark error:', error);
      showToast({ title: 'Failed to bookmark', type: 'error' });
    }
  };

  const content = event?.content || '';
  const truncatedContent = content.length > 200 ? `${content.slice(0, 200)}...` : content;

  return (
    <View style={styles.container}>
      <View style={styles.info}>
        <View style={styles.infoUser}>
          <Pressable onPress={() => handleProfilePress(event?.pubkey)}>
            <Avatar
              size={asComment ? 40 : 50}
              source={
                profile?.image ? { uri: profile.image } : require('../../assets/degen-logo.png')
              }
            />
          </Pressable>

          <Pressable style={styles.infoProfile} onPress={handleNavigateToPostDetails}>
            <Text
              weight="bold"
              color="textStrong"
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
              {(profile?.nip05 || profile?.name) && (
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
              )}

              <Text color="textLight" fontSize={11} lineHeight={16}>
                {getElapsedTimeStringFull((event?.created_at ?? Date.now()) * 1000)}
              </Text>
            </View>
          </Pressable>
        </View>

        <Pressable onPress={toggleLike}>
          <View style={styles.infoLikes}>
            <Animated.View style={animatedLikeIconStyle}>
              {isLiked ? (
                <LikeFillIcon height={20} color={theme.colors.red} />
              ) : (
                <LikeIcon height={20} color={theme.colors.text} />
              )}
            </Animated.View>

            {likes > 0 && (
              <Text color="textSecondary" fontSize={11} lineHeight={16}>
                {likes} {likes === 1 ? 'like' : 'likes'}
              </Text>
            )}
          </View>
        </Pressable>
      </View>

      <View style={styles.content}>
        <Pressable onPress={handleNavigateToPostDetails}>
          <Text color="textStrong" fontSize={13} lineHeight={20}>
            {isContentExpanded ? content : truncatedContent}
          </Text>

          {content.length > 200 && (
            <Pressable onPress={toggleExpandedContent}>
              <Text style={styles.seeMore}>{isContentExpanded ? 'See less' : 'See more...'}</Text>
            </Pressable>
          )}

          {postSource && (
            <Image
              source={postSource}
              style={[
                styles.contentImage,
                {
                  height: dimensionsMedia[1],
                  aspectRatio: getImageRatio(postSource.width, postSource.height),
                },
              ]}
            />
          )}
        </Pressable>
      </View>

      {!asComment && (
        <View style={styles.footer}>
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'baseline',
              gap: 10,
            }}
          >
            <Pressable onPress={handleNavigateToPostDetails}>
              <View style={styles.footerComments}>
                <CommentIcon height={20} color={theme.colors.textSecondary} />

                <Text color="textSecondary" fontSize={11} lineHeight={16}>
                  {comments.data?.pages.flat().length} comments
                </Text>
              </View>
            </Pressable>

            <Pressable
              style={{ marginHorizontal: 3 }}
              onPress={() => {
                if (!event) return;
                showTipModal(event);
              }}
            >
              <Icon name="CoinIcon" size={20} title="Tip" />
            </Pressable>

            <Pressable
              style={{ marginHorizontal: 3 }}
              onPress={handleRepost}
              disabled={repostMutation.isPending}
            >
              <Animated.View style={animatedRepostIconStyle}>
                {isReposted ? (
                  <RepostFillIcon height={20} color={theme.colors.primary} />
                ) : (
                  <RepostIcon height={20} color={theme.colors.textSecondary} />
                )}
              </Animated.View>
              {repostMutation.isPending && <ActivityIndicator size="small" />}
            </Pressable>

            <Pressable
              style={{ marginHorizontal: 3 }}
              onPress={handleBookmark}
              disabled={bookmarkMutation.isPending}
            >
              <Animated.View style={animatedBookmarkIconStyle}>
                {isBookmarked ? (
                  <BookmarkFillIcon height={20} color={theme.colors.primary} />
                ) : (
                  <BookmarkIcon height={20} color={theme.colors.textSecondary} />
                )}
              </Animated.View>
              {bookmarkMutation.isPending && <ActivityIndicator size="small" />}
            </Pressable>
          </View>

          <Menu
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            handle={
              <IconButton icon="MoreHorizontalIcon" size={20} onPress={() => setMenuOpen(true)} />
            }
          >
            <Menu.Item label="Share" icon="ShareIcon" />
            <Menu.Item
              label={profile?.username ? `Tip @${profile.username}` : 'Tip'}
              icon="CoinIcon"
              onPress={() => {
                if (!event) return;

                showTipModal(event);
                setMenuOpen(false);
              }}
            />
          </Menu>
        </View>
      )}
    </View>
  );
};