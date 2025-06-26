import {NDKKind} from '@nostr-dev-kit/ndk';
import {useAllProfiles, useSearchTag} from 'afk_nostr_sdk';
import React, {useMemo} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';

import {AddPostIcon} from '../../assets/icons';
import {IconButton} from '../../components';
import {BubbleUser} from '../../components/BubbleUser';
import {useStyles, useTheme} from '../../hooks';
import {ChannelComponent} from '../../modules/ChannelCard';
import {PostCard} from '../../modules/PostCard';
import {VideoPostCard} from '../../modules/VideoPostCard';
import {TagsScreenProps} from '../../types';
import stylesheet from './styles';
import {TagsComponent} from './TagsComponent';
const KINDS: NDKKind[] = [
  NDKKind.Text,
  NDKKind.ChannelCreation,
  NDKKind.GroupChat,
  NDKKind.ChannelMessage,
  NDKKind.Metadata,
  NDKKind.VerticalVideo,
  NDKKind.HorizontalVideo,
];

export const TagsView: React.FC<TagsScreenProps> = ({navigation, route}) => {
  const {theme} = useTheme();
  const styles = useStyles(stylesheet);

  return (
    <View style={styles.container}>
      <Image
        style={styles.backgroundImage}
        source={require('../../assets/feed-background-afk.png')}
        resizeMode="cover"
      />
      <TagsComponent tagName={route.params.tagName} />

      <Pressable
        style={styles.createPostButton}
        onPress={() => navigation.navigate('MainStack', {screen: 'CreateForm'})}
      >
        <AddPostIcon width={72} height={72} color={theme.colors.primary} />
      </Pressable>
    </View>
  );
};
