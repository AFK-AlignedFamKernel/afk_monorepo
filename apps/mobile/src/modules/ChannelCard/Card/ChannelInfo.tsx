import {NDKEvent} from '@nostr-dev-kit/ndk';
import {useNavigation} from '@react-navigation/native';
import {useQueryClient} from '@tanstack/react-query';
// import {useAuth} from '../../../store/auth';
import {useAuth} from 'afk_nostr_sdk';
import {useProfile, useReact, useReactions, useReplyNotes} from 'afk_nostr_sdk';
import {useEffect, useMemo, useState} from 'react';
import {Pressable, View} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import {LikeFillIcon, LikeIcon} from '../../../assets/icons';
import {Avatar, Text} from '../../../components';
import {useNostrAuth, useStyles, useTheme} from '../../../hooks';
import {useTipModal} from '../../../hooks/modals';
import {MainStackNavigationProps} from '../../../types';
import {IChannelsMetadata} from '../../../types/channels';
import {shortenPubkey} from '../../../utils/helpers';
import {getElapsedTimeStringFull} from '../../../utils/timestamp';
import stylesheet from './styles';

export type PostProps = {
  asComment?: boolean;
  event?: NDKEvent;
};

export const ChannelInfo: React.FC<PostProps> = ({asComment, event}) => {
  const repostedEvent = undefined;

  const {theme} = useTheme();
  const styles = useStyles(stylesheet);

  const navigation = useNavigation<MainStackNavigationProps>();

  const [channelInfo, setChannelInfo] = useState<undefined | IChannelsMetadata>();
  useEffect(() => {
    const getChannel = async () => {
      if (!event?.content) return;
      const json = JSON.parse(event?.content?.toString());
      setChannelInfo(json);
    };

    if (event) getChannel();
  }, [event]);

  const {publicKey} = useAuth();
  const {show: showTipModal} = useTipModal();
  const {data: profile} = useProfile({publicKey: event?.pubkey});
  const reactions = useReactions({noteId: event?.id});
  const userReaction = useReactions({authors: [publicKey], noteId: event?.id});
  const comments = useReplyNotes({noteId: event?.id});
  const react = useReact();
  const queryClient = useQueryClient();
  const {handleCheckNostrAndSendConnectDialog} = useNostrAuth();

  const [menuOpen, setMenuOpen] = useState(false);

  const scale = useSharedValue(1);

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
    navigation.navigate('ChannelDetail', {postId: event?.id, post: event});
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
            withTiming(1.5, {duration: 100, easing: Easing.out(Easing.ease)}), // Scale up
            withSpring(1, {damping: 6, stiffness: 200}), // Bounce back
          );
        },
      },
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.info}>
        <View style={styles.infoUser}>
          <Pressable style={styles.infoProfile} onPress={handleNavigateToPostDetails}>
            {channelInfo?.picture && (
              <Avatar
                // size={asComment ? 40 : 50}
                size={100}
                source={
                  channelInfo?.picture
                    ? {uri: channelInfo?.picture}
                    : require('../../../assets/degen-logo.png')
                }
              />
            )}

            <Text
              style={styles.channelName}
              weight="bold"
              color="textStrong"
              fontSize={asComment ? 13 : 15}
              lineHeight={20}
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              {channelInfo?.name ??
                channelInfo?.name ??
                channelInfo?.displayName ??
                shortenPubkey(event?.pubkey)}
            </Text>

            {channelInfo?.displayName && (
              <Text
                weight="bold"
                color="textStrong"
                fontSize={asComment ? 13 : 15}
                lineHeight={20}
                numberOfLines={1}
                ellipsizeMode="middle"
              >
                #{channelInfo?.displayName ?? shortenPubkey(event?.pubkey)}
              </Text>
            )}
          </Pressable>
        </View>
        <View>
          <View style={styles.infoDetails}>
            <Text color="textLight" fontSize={11} lineHeight={16}>
              Created {getElapsedTimeStringFull((event?.created_at ?? Date.now()) * 1000)}
            </Text>
            {profile?.image && (
              <Avatar
                size={30}
                source={
                  profile?.image ? {uri: profile?.image} : require('../../../assets/afk-logo.png')
                }
              />
            )}

            {(profile?.nip05 || profile?.name) && (
              <>
                <Text
                  color="textLight"
                  fontSize={11}
                  lineHeight={16}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  By @{profile?.nip05 ?? profile.name}
                </Text>

                {/* <View style={styles.infoDetailsDivider} /> */}
              </>
            )}
          </View>
        </View>

        <Pressable onPress={toggleLike}>
          <View style={styles.infoLikes}>
            <Animated.View style={animatedIconStyle}>
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
            {channelInfo?.about ?? event?.content}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};
