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

  const profiles = useAllProfiles({limit: 10});

  const notes = useSearchTag({
    kinds: KINDS,
    limit: 10,
    hashtag: route.params?.tagName,
  });

  const flattenedNotes = useMemo(() => notes.data?.pages.flat() || [], [notes.data?.pages]);

  return (
    <View style={styles.container}>
      <Image
        style={styles.backgroundImage}
        source={require('../../assets/feed-background-afk.png')}
        resizeMode="cover"
      />

      {notes?.isLoading && <ActivityIndicator></ActivityIndicator>}
      {notes?.data?.pages?.length == 0 && <ActivityIndicator></ActivityIndicator>}

      <FlatList
        ListHeaderComponent={
          <>
            <View style={styles.headerContainer}>
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                }}
              >
                <IconButton
                  backgroundColor="transparent"
                  icon="ChevronLeftIcon"
                  size={20}
                  style={styles.backButton}
                  onPress={navigation.goBack}
                />

                <View>
                  <Text style={styles.hashtagText}>#{route?.params.tagName}</Text>
                  <Text style={styles.noteCount}>{flattenedNotes.length} notes</Text>
                </View>
              </View>
              <FlatList
                contentContainerStyle={styles.stories}
                horizontal
                data={profiles?.data?.pages?.flat()}
                showsHorizontalScrollIndicator={false}
                onEndReached={() => profiles.fetchNextPage()}
                refreshControl={
                  <RefreshControl
                    refreshing={profiles.isFetching}
                    onRefresh={() => profiles.refetch()}
                  />
                }
                ItemSeparatorComponent={() => <View style={styles.storySeparator} />}
                renderItem={({item}) => <BubbleUser event={item} />}
              />
            </View>
          </>
        }
        contentContainerStyle={styles.flatListContent}
        data={flattenedNotes}
        keyExtractor={(item) => item?.id}
        renderItem={({item}) => {
          if (item.kind === NDKKind.ChannelCreation || item.kind === NDKKind.ChannelMetadata) {
            return <ChannelComponent event={item} />;
          } else if (item.kind === NDKKind.ChannelMessage) {
            return <PostCard event={item} />;
          } else if (item.kind === NDKKind.VerticalVideo || item.kind === NDKKind.HorizontalVideo) {
            return <VideoPostCard event={item} />;
          } else if (item.kind === NDKKind.Text) {
            return <PostCard event={item} />;
          }
          return <></>;
        }}
        refreshControl={
          <RefreshControl refreshing={notes.isFetching} onRefresh={() => notes.refetch()} />
        }
        onEndReached={() => notes.fetchNextPage()}
      />

      <Pressable
        style={styles.createPostButton}
        onPress={() => navigation.navigate('MainStack', {screen: 'CreateForm'})}
      >
        <AddPostIcon width={72} height={72} color={theme.colors.primary} />
      </Pressable>
    </View>
  );
};
