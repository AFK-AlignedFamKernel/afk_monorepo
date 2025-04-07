import {NDKKind} from '@nostr-dev-kit/ndk';
import {useAllProfiles, useProfileTagsInterests, useSearchTag} from 'afk_nostr_sdk';
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


interface ITagsComponentProps {
  tagName: string;
  limit?: number;
  profilesLimit?: number;
  isViewCount?: boolean;
}

export const TagsComponent: React.FC<ITagsComponentProps> = ({tagName, limit = 20, profilesLimit = 10, isViewCount = false}) => {
  const {theme} = useTheme();
  const styles = useStyles(stylesheet);

  const profiles = useProfileTagsInterests({limit: profilesLimit, hashtag: tagName});

  const notes = useSearchTag({
    kinds: KINDS,
    limit: limit,
    hashtag: tagName,
  });

  const flattenedNotes = useMemo(() => notes.data?.pages.flat() || [], [notes.data?.pages]);

  return (
    <View style={styles.container}>

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
             

                <View>
                  <Text style={styles.hashtagText}>#{tagName}</Text>
                  {isViewCount && <Text style={styles.noteCount}>{flattenedNotes.length} notes</Text>}
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

    </View>
  );
};
