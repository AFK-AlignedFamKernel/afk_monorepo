import { useBookmark, useReposts, useRootNotes, useSearch } from 'afk_nostr_sdk';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, View } from 'react-native';

import { useStyles } from '../../hooks';
import { PostCard } from '../../modules/PostCard';
import { ProfileScreenProps } from '../../types';
import { ProfileInfo } from './Info';
import stylesheet from './styles';
import { useMemo, useState } from 'react';
import { NDKKind } from '@nostr-dev-kit/ndk';
import { Text } from '../../components';

export const Profile: React.FC<ProfileScreenProps> = ({ route }) => {
  const { publicKey } = route.params ?? {};
  const styles = useStyles(stylesheet);
  const [ndkKinds, setNdkKind] = useState<NDKKind[]>([NDKKind.Text]);

  const kindFilter = useMemo(() => {
    return ndkKinds
  }, [ndkKinds])

  const notesSearch = useRootNotes({ authors: [publicKey] });
  const search = useSearch({ authors: [publicKey], kinds: kindFilter });
  const reposts = useReposts({ authors: [publicKey] });
  const { bookmarksWithNotes } = useBookmark(publicKey);

  const getData = ndkKinds.includes(NDKKind.BookmarkList) || ndkKinds.includes(NDKKind.BookmarkSet)
    ? bookmarksWithNotes?.map(bookmark => bookmark.notes).flat() || []
    : search.data?.pages.flat();

  return (
    <View style={styles.container}>

      <FlatList
        ListHeaderComponent={
          <>
            <ProfileInfo publicKey={publicKey} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.optionsContentContainer}
              style={styles.optionsContainer}
            >
              <Pressable
                onPress={() => setNdkKind([NDKKind.Text])}
                style={[styles.option, ndkKinds.includes(NDKKind.Text) && styles.selected]}
              >
                <Text>Notes</Text>
              </Pressable>
              <Pressable
                onPress={() => setNdkKind([NDKKind.Repost])}
                style={[styles.option, ndkKinds.includes(NDKKind.Repost) && styles.selected]}
              >
                <Text>Repost</Text>
              </Pressable>
              <Pressable
                onPress={() => setNdkKind([NDKKind.BookmarkList, NDKKind.BookmarkSet])}
                style={[styles.option, ndkKinds.includes(NDKKind.BookmarkList) && styles.selected]}
              >
                <Text>Bookmarks</Text>
              </Pressable>
            </ScrollView>
          </>
        }
        data={getData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          if (ndkKinds.includes(NDKKind.Repost)) {
            const itemReposted = JSON.parse(item?.content);
            return <PostCard key={item?.id} event={itemReposted} isRepostProps={true} />
          }
          return <PostCard key={item?.id} event={item} />
        }}
        refreshControl={
          <RefreshControl refreshing={search.isFetching} onRefresh={() => search.refetch()} />
        }
      />

      {search?.isLoading && <ActivityIndicator />}
    </View>
  );
};
