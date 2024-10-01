import {NDKEvent} from '@nostr-dev-kit/ndk';
import {useNavigation} from '@react-navigation/native';
import {useQueryClient} from '@tanstack/react-query';
// import {useAuth} from '../../../store/auth';
import {useAuth} from 'afk_nostr_sdk';
import {useMessagesChannels, useProfile, useReact, useReactions} from 'afk_nostr_sdk';
import {useEffect, useMemo, useState} from 'react';
import {Pressable, View} from 'react-native';
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import {CommentIcon} from '../../../assets/icons';
import {IconButton, Menu, Text} from '../../../components';
import {useNostrAuth, useStyles, useTheme} from '../../../hooks';
import {useTipModal} from '../../../hooks/modals';
import {MainStackNavigationProps} from '../../../types';
import {IChannelsMetadata} from '../../../types/channels';
import {ChannelInfo} from './ChannelInfo';
import stylesheet from './styles';
export type PostProps = {
  asComment?: boolean;
  event?: NDKEvent;
};

export const CardChannel: React.FC<PostProps> = ({asComment, event}) => {
  const repostedEvent = undefined;

  const {theme} = useTheme();
  const styles = useStyles(stylesheet);

  const navigation = useNavigation<MainStackNavigationProps>();
  const {handleCheckNostrAndSendConnectDialog} = useNostrAuth();

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
  // const comments = useReplyNotes({noteId: event?.id});
  const comments = useMessagesChannels({noteId: event?.id});
  const react = useReact();
  const queryClient = useQueryClient();

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

  const postSource = useMemo(() => {
    // if (!event?.tags) return;
    if (!channelInfo?.picture) return;
    // const imageTag = event.tags.find((tag) => tag[0] === 'image');
    // if (!imageTag) return;
    // const dimensions = imageTag[2].split('x').map(Number);
    return {
      uri: channelInfo?.picture,
      width: 150,
      height: 150,
      // width: dimensions[0], height: dimensions[1]
    };
    // return { uri: imageTag[1], width: dimensions[0], height: dimensions[1] };
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
      <ChannelInfo event={event}></ChannelInfo>

      {/* TODO: check tags if it's: quote repost reply  */}

      {!asComment && (
        <View style={styles.footer}>
          <Pressable onPress={handleNavigateToPostDetails}>
            <View style={styles.footerComments}>
              <CommentIcon height={20} color={theme.colors.textSecondary} />

              <Text color="textSecondary" fontSize={11} lineHeight={16}>
                {comments.data?.pages.flat().length} messages
              </Text>
            </View>
          </Pressable>

          <Menu
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            handle={
              <IconButton icon="MoreHorizontalIcon" size={20} onPress={() => setMenuOpen(true)} />
            }
          >
            {/* <Menu.Item label="Share" icon="ShareIcon" /> */}
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
