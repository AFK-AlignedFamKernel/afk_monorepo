import { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk';
import { useAllProfiles, useSearch } from 'afk_nostr_sdk';
import { useAuth, useContacts } from 'afk_nostr_sdk';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, View, Text } from 'react-native';

import { AddPostIcon } from '../../assets/icons';
import { BubbleUser } from '../../components/BubbleUser';
import SearchComponent from '../../components/search';
import { useStyles, useTheme } from '../../hooks';
import { ChannelComponent } from '../../modules/ChannelCard';
import { PostCard } from '../../modules/PostCard';
import { VideoPostCard } from '../../modules/VideoPostCard';
import { FeedScreenProps } from '../../types';
import stylesheet from './styles';
import { SORT_OPTIONS } from '../../types/nostr';
import { RenderEventCard } from '../../modules/Studio';

export const Feed: React.FC<FeedScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const { publicKey } = useAuth();
  const styles = useStyles(stylesheet);
  const profiles = useAllProfiles({ limit: 10 });
  const [activeSortBy, setSortBy] = useState<string | undefined>("0");
  const [search, setSearch] = useState<string | undefined>(undefined);
  const [feedData, setFeedData] = useState(null);
  const [kinds, setKinds] = useState<NDKKind[]>([
    NDKKind.Text,
    NDKKind.ChannelMessage,
    NDKKind.Metadata,
    NDKKind.VerticalVideo,
    NDKKind.HorizontalVideo,
    30311 as NDKKind,
    NDKKind.ChannelCreation,
    NDKKind.GroupChat,
  ]);

  const contacts = useContacts({ authors: [publicKey] });
  const notes = useSearch({
    kinds,
    // search:search
    // limit: 20,
    // authors: []
  });

  console.log("activeSortBy", activeSortBy);
  // const notes = useNotesFilter({
  //   kinds,
  //   limit: 20,
  // });
  // console.log('notes', notes);

  // Filter profiles based on the search query
  const profilesSearch =
    profiles?.data?.pages?.flat() ??
    //   .filter((item) => (search && search?.length > 0 ? item?.content?.includes(search) : true)) ??
    [];
  const filteredNotes = useCallback(() => {
    const flattenedPages = notes?.data?.pages.flat();

    // if (!notes.data?.pages || flattenedPages?.length == 0) return [];
    if (!notes.data?.pages || flattenedPages?.length == 0) return [];

    console.log('flattenedPages', flattenedPages);

    console.log(flattenedPages, 'note pages');
    // if (!search || search.length === 0) {
    //   setFeedData(flattenedPages as any);
    //   return flattenedPages;
    // }

    const searchLower = search?.toLowerCase();
    let filtered: any[] | undefined = [];
    if (activeSortBy == "0") {
      console.log('RECENT SORT',);
      filtered = flattenedPages?.filter((item) =>
        item?.content?.toLowerCase().includes(searchLower),
      )
        .sort((a, b) => {
          const aCreated = a?.created_at || 0;
          const bCreated = b?.created_at || 0;
          return bCreated - aCreated; // Sort descending (most recent first)
        }) ?? flattenedPages;

      // filtered = flattenedPages?.filter((item) =>
      //   item?.content?.toLowerCase().includes(searchLower),
      // ) ?? flattenedPages;
    }
    else if (activeSortBy == "1") {
      // TODO add trending notes
      filtered = flattenedPages?.filter((item) =>
        item?.content?.toLowerCase().includes(searchLower),
      ) ?? flattenedPages;
      console.log('search result is => ', filtered);
      return filtered;
    } else if (activeSortBy == '2' && contacts && contacts?.data) {
      const forYouNotes =
        notes.data?.pages.flat().filter((item) => item?.pubkey === contacts?.data[0]) ?? [];
      // console.log('something', forYouNotes);
      setFeedData(forYouNotes as any);
    }

    if (searchLower && searchLower?.length > 0) {
      filtered = flattenedPages?.filter((item) =>
        item?.content?.toLowerCase().includes(searchLower),
      ) ?? flattenedPages;
      console.log('search result is => ', filtered);
    }
    // return filtered;

    console.log('search result is => ', filtered);
    return filtered;
  }, [notes.data?.pages, search, activeSortBy]);
  // Filter notes based on the search query
  useEffect(() => {
    const filtered = filteredNotes();
    console.log('Filtered notes:', filtered);
    setFeedData(filtered as any);
    // console.log('feed data is => ', filtered);
  }, [notes.data?.pages, search, activeSortBy]);

  useEffect(() => {
    console.log(activeSortBy, 'contacts', contacts);

    const filtered = filteredNotes();
    setFeedData(filtered as any);
    // if (activeSortBy === '2' && contacts && contacts?.data) {
    //   const forYouNotes =
    //     notes.data?.pages.flat().filter((item) => item?.pubkey === contacts?.data[0]) ?? [];
    //   // console.log('something', forYouNotes);
    //   setFeedData(forYouNotes as any);
    // }
  }, [activeSortBy]);

  const handleNavigate = (id: string) => {
    navigation.navigate('WatchStream', { streamId: id });
  };

  const handleNavigateToStreamView = (id: string) => {
    navigation.navigate('ViewStreamGuest', { streamId: id });
  };

  return (
    <View style={styles.container}>
      <SearchComponent
        setSearchQuery={setSearch}
        searchQuery={search ?? ''}
        kinds={kinds}
        setKinds={setKinds}
        setSortBy={setSortBy}
        sortBy={activeSortBy}
      />

      {notes?.isFetching && (
        <ActivityIndicator color={theme.colors.primary} size={20}></ActivityIndicator>
      )}
      {!notes?.isLoading ||
        (!notes?.isFetching && notes?.data?.pages?.length == 0 && (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text
              style={{
                color: theme.colors.text,
              }}
            >
              No notes found
            </Text>
            <Text
              style={{
                color: theme.colors.text,
              }}
            >
              Try to refresh the page or contact the support please!
            </Text>
          </View>
        ))}

      <FlatList
        // ListHeaderComponent={
        //   <>
        //     <FlatList
        //       contentContainerStyle={styles.stories}
        //       horizontal
        //       data={profilesSearch}
        //       showsHorizontalScrollIndicator={false}
        //       onEndReached={() => profiles.fetchNextPage()}
        //       refreshControl={
        //         <RefreshControl
        //           refreshing={profiles.isFetching}
        //           onRefresh={() => profiles.refetch()}
        //         />
        //       }
        //       ItemSeparatorComponent={() => <View style={styles.storySeparator} />}
        //       renderItem={({item}) => <BubbleUser event={item} />}
        //     />
        //   </>
        // }
        contentContainerStyle={styles.flatListContent}
        data={feedData}
        // data={filteredNotes}
        keyExtractor={(item) => item?.id}
        renderItem={({ item }) => {
          if (item.kind === NDKKind.ChannelCreation || item.kind === NDKKind.ChannelMetadata) {
            return <ChannelComponent event={item} />;
          } else if (item.kind === NDKKind.ChannelMessage) {
            return <PostCard event={item}
              isReplyView={true}
            />;
          } else if (item.kind === NDKKind.VerticalVideo || item.kind === NDKKind.HorizontalVideo) {
            return <VideoPostCard event={item} />;
          } else if (item.kind === NDKKind.Text) {
            return <PostCard event={item} isReplyView={true} />;
          }
          else if (item.kind === 30311) {

            if (item?.identifier) {
              return <RenderEventCard
                handleNavigateToStreamView={() => handleNavigateToStreamView(item?.identifier)}
                streamKey={item?.identifier}
                handleNavigation={() => handleNavigate(item?.identifier)}
                pubKey={publicKey}
                event={item}
              />
            }
            else {
              return <></>
            }
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
        onPress={() => navigation.navigate('MainStack', { screen: 'CreateForm' })}
      >
        <AddPostIcon width={72} height={72} color={theme.colors.primary} />
      </Pressable>
    </View>
  );
};
