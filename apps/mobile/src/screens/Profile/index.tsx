import {NDKKind} from '@nostr-dev-kit/ndk';
import {useBookmark, useSearch} from 'afk_nostr_sdk';
import {useMemo, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';

import {Text} from '../../components';
import {useStyles} from '../../hooks';
import {PostCard} from '../../modules/PostCard';
import {ProfileScreenProps} from '../../types';
import {ProfileInfo} from './Info';
import stylesheet from './styles';

export const Profile: React.FC<ProfileScreenProps> = ({route}) => {
  const {publicKey} = route.params ?? {};
  const styles = useStyles(stylesheet);
  const [ndkKinds, setNdkKind] = useState<NDKKind[]>([NDKKind.Text]);

  const kindFilter = useMemo(() => {
    return ndkKinds;
  }, [ndkKinds]);

  // const notesSearch = useRootNotes({ authors: [publicKey] });
  const search = useSearch({authors: [publicKey], kinds: kindFilter});
  // const reposts = useReposts({ authors: [publicKey] });
  const {bookmarksWithNotes} = useBookmark(publicKey);

  // Extract all bookmarked note IDs
  const bookmarkedNoteIds = useMemo(() => {
    if (!bookmarksWithNotes.data) return new Set<string>();

    const ids = new Set<string>();
    bookmarksWithNotes.data.forEach((bookmark) => {
      bookmark.notes.forEach((note) => {
        if(note?.id) {
          ids?.add(note?.id || '');
        }
      });
    });
    return ids;
  }, [bookmarksWithNotes?.data]);

  // Function to check if a note is bookmarked
  const isBookmarked = (noteId: string) => bookmarkedNoteIds.has(noteId);

  const getData =
    ndkKinds.includes(NDKKind.BookmarkList) || ndkKinds.includes(NDKKind.BookmarkSet)
      ? bookmarksWithNotes?.data?.map((bookmark) => bookmark?.notes)?.flat() || []
      : search.data?.pages?.flat();

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
        keyExtractor={(item) => item?.id}
        renderItem={({item}) => {
          if (!item) return <></>;
          if (ndkKinds.includes(NDKKind.Repost)) {
            const itemReposted = JSON.parse(item?.content);
            return <PostCard key={item?.id} event={itemReposted} isRepostProps={true} />;
          }
          return <PostCard key={item?.id} event={item} isBookmarked={isBookmarked(item?.id)} />;
        }}
        refreshControl={
          <RefreshControl
            refreshing={search.isFetching || bookmarksWithNotes.isFetching}
            onRefresh={() => {
              search.refetch();
              bookmarksWithNotes.refetch();
            }}
          />
        }
      />
      {(search?.isPending ||
        bookmarksWithNotes?.isPending ||
        search?.isLoading ||
        bookmarksWithNotes?.isLoading) && <ActivityIndicator />}
    </View>
  );
};
