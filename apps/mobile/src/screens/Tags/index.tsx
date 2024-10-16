import {NDKKind} from '@nostr-dev-kit/ndk';
import {useAllProfiles, useSearch} from 'afk_nostr_sdk';
import {useEffect, useMemo, useState} from 'react';
import {FlatList, Image, Pressable, RefreshControl, Text, View} from 'react-native';

import {AddPostIcon} from '../../assets/icons';
import {BubbleUser} from '../../components/BubbleUser';
import {useStyles, useTheme} from '../../hooks';
import {ChannelComponent} from '../../modules/ChannelCard';
import {PostCard} from '../../modules/PostCard';
import {TagsScreenProps} from '../../types';
import stylesheet from './styles';

export const TagsView: React.FC<TagsScreenProps> = ({navigation, route}) => {
  const {theme} = useTheme();
  const styles = useStyles(stylesheet);
  const profiles = useAllProfiles({limit: 10});
  const [feedData, setFeedData] = useState(null);
  const [kinds] = useState<NDKKind[]>([
    NDKKind.Text,
    NDKKind.ChannelCreation,
    NDKKind.GroupChat,
    NDKKind.ChannelMessage,
    NDKKind.Metadata,
  ]);

  const notes = useSearch({
    kinds,
    limit: 10,
  });

  // Filter notes based on the hashtag present in the URL query
  const filteredNotes = useMemo(() => {
    const urlQuery = route?.params.tagName;
    if (!notes.data?.pages || !urlQuery) return [];

    const flattenedPages = notes.data.pages.flat();
    return flattenedPages.filter((item) =>
      item?.tags?.some((tag: any) => tag[0] === 't' && tag[1] === urlQuery),
    );
  }, [notes.data?.pages, route?.params.tagName]);

  // Update the feedData when filtered notes change
  useEffect(() => {
    setFeedData(filteredNotes as any);
  }, [filteredNotes]);

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.hashtagText}>#{route?.params.tagName}</Text>
      <Text style={styles.noteCount}>{filteredNotes.length} notes</Text>
      <FlatList
        contentContainerStyle={styles.stories}
        horizontal
        data={profiles?.data?.pages?.flat()}
        showsHorizontalScrollIndicator={false}
        onEndReached={() => profiles.fetchNextPage()}
        refreshControl={
          <RefreshControl refreshing={profiles.isFetching} onRefresh={() => profiles.refetch()} />
        }
        ItemSeparatorComponent={() => <View style={styles.storySeparator} />}
        renderItem={({item}) => <BubbleUser event={item} />}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <Image
        style={styles.backgroundImage}
        source={require('../../assets/feed-background-afk.png')}
        resizeMode="cover"
      />
      <FlatList
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.flatListContent}
        data={feedData}
        keyExtractor={(item) => item?.id}
        renderItem={({item}) => {
          if (item.kind === NDKKind.ChannelCreation || item.kind === NDKKind.ChannelMetadata) {
            return <ChannelComponent event={item} />;
          } else if (item.kind === NDKKind.ChannelMessage || item.kind === NDKKind.Text) {
            return <PostCard event={item} />;
          }
          return null;
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
