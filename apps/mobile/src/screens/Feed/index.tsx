import { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk';
import { useAllProfiles, useNostrContext, useProfile, useSearch } from 'afk_nostr_sdk';
import { useAuth, useContacts } from 'afk_nostr_sdk';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, View, Text } from 'react-native';

import { AddPostIcon } from '../../assets/icons';
import { BubbleUser } from '../../components/BubbleUser';
import SearchComponent from '../../components/search';
import { useNostrAuth, useStyles, useTheme } from '../../hooks';
import { ChannelComponent } from '../../modules/ChannelCard';
import { PostCard } from '../../modules/PostCard';
import { VideoPostCard } from '../../modules/VideoPostCard';
import { FeedScreenProps } from '../../types';
import stylesheet from './styles';
import { SORT_OPTIONS, SORT_OPTION_EVENT_NOSTR } from '../../types/nostr';
import { RenderEventCard } from '../../modules/Studio';
import { Button } from '../../components';

export const Feed: React.FC<FeedScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const { publicKey } = useAuth();
  const { ndk } = useNostrContext();
  const styles = useStyles(stylesheet);
  const profiles = useAllProfiles({ limit: 10 });
  const [activeSortBy, setSortBy] = useState<string | undefined>(SORT_OPTION_EVENT_NOSTR.TIME?.toString());
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


  const [followersPubkey, setFollowersPubkey] = useState<string[]>([]);
  const profile = useProfile({ publicKey });
  const contacts = useContacts({ authors: [publicKey] });
  const notes = useSearch({
    limit: 10,
    since: 1000*60*60,
    // getNextPageParam: (lastPage, allPages) => {
    //   if (!lastPage?.length) return undefined;

    //   // Get timestamp of oldest note in current page
    //   const oldestTimestamp = Math.min(...lastPage.map(note => note.created_at));

    //   // Only fetch next page if:
    //   // 1. We have notes in current page
    //   // 2. Oldest note is not too old (e.g. within last 30 days)
    //   // 3. We haven't fetched too many pages yet
    //   const thirtyDaysAgo = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);
    //   if (oldestTimestamp > thirtyDaysAgo && allPages.length < 10) {
    //     return oldestTimestamp - 1; // Get notes older than current page
    //   }
    //   return undefined;
    // },
    kinds,
    // search:search
    // limit: 20,
    // authors: []
  });

  const notesForYou = useSearch({
    kinds,
    limit: 10,
    authors: [...contacts?.data?.map((c) => c) || [], ...followersPubkey]
  });
  const [forYouNotes, setForYouNotes] = useState<NDKEvent[]>([]);
  // console.log("activeSortBy", activeSortBy);
  // console.log("profile", profile);
  // console.log("publicKey", publicKey);
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
  const filteredNotes = useCallback(async () => {
    const flattenedPages = notes?.data?.pages.flat();

    // if (!notes.data?.pages || flattenedPages?.length == 0) return [];
    if (!notes.data?.pages || flattenedPages?.length == 0) return [];

    // console.log('flattenedPages', flattenedPages);
    // console.log(flattenedPages, 'note pages');
    // if (!search || search.length === 0) {
    //   setFeedData(flattenedPages as any);
    //   return flattenedPages;
    // }
    const searchLower = search?.toLowerCase();
    let filtered: any[] | undefined = [];
    if (
      // activeSortBy == "0" || 
      activeSortBy == SORT_OPTION_EVENT_NOSTR.TIME?.toString()
    ) {
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
    else if (activeSortBy == SORT_OPTION_EVENT_NOSTR.TRENDING?.toString()
      // || activeSortBy == "1"
    ) {
      console.log('TRENDING SORT');
      // TODO add trending notes
      filtered = flattenedPages?.filter((item) =>
        item?.content?.toLowerCase().includes(searchLower),
      ) ?? flattenedPages;
      return filtered;
    } else if (
      // activeSortBy == '2' || 
      activeSortBy == SORT_OPTION_EVENT_NOSTR.FOR_YOU?.toString()
      && contacts && contacts?.data

    ) {

      // const profileNdk = new NDKUserProfile({publicKey});
      const user = ndk.getUser({ pubkey: publicKey });
      const profileNdk = await user.fetchProfile();

      // const followers = profile?.data?.followers;
      const followers = await user?.follows();
      // console.log("followers", followers);
      // console.log("contacts", contacts?.data);

      setFollowersPubkey([...followers].map((n) => n?.pubkey) || []);
      // let forYouNotes =
      //   notes.data?.pages.flat().filter((item) =>{
      //     contacts?.data?.some(contactPubkey => item?.pubkey === contactPubkey)
      //   || [...followers]?.flat()?.some((n) => item?.pubkey === n?.pubkey)
      //   }
      //   ) ?? [];
      let forYouNotes =
        notes.data?.pages.flat().filter((item) => {
          contacts?.data?.some(contactPubkey => item?.pubkey === contactPubkey)
            || [...followers]?.flat()?.some((n) => item?.pubkey === n?.pubkey)
        }
        ) ?? [];
      // console.log('forYouNotes', forYouNotes);

      forYouNotes =
        notes?.data?.pages?.flat().map((item) =>
          [...followers]?.flat()?.some((n) => item?.pubkey === n?.pubkey)
        ) ?? [];

      // notes.data?.pages.flat().filter((item) => item?.pubkey === contacts?.data[0]) ?? [];
      console.log('forYouNotes', forYouNotes);
      setFeedData(forYouNotes as any);
      // setForYouNotes(forYouNotes as any);
    }
    else if (
      // activeSortBy == "3" ||
      activeSortBy == SORT_OPTION_EVENT_NOSTR.INTERESTS?.toString()) {
      console.log('INTERESTS SORT');
      // TODO add interests notes
      // filtered = flattenedPages?.filter((item) =>
      //   item?.content?.toLowerCase().includes(searchLower) || item?.tags?.some((tag: string) => tag[1]?.match(/^#(.*)$/)),
      // ) ?? flattenedPages;
    }
    if (searchLower && searchLower?.length > 0) {
      filtered = flattenedPages?.filter((item) =>
        item?.content?.toLowerCase().includes(searchLower),
      ) ?? flattenedPages;
      // console.log('search result is => ', filtered);
    }
    // return filtered;
    // setFeedData(filtered as any);
    setFeedData(filtered?.filter((note, index, self) =>
      index === self.findIndex((n) => n.id === note.id)
    ) as any);

    // console.log('filtered notes => ', filtered);
    return filtered;
  }, [notes.data?.pages, search, activeSortBy, publicKey, contacts?.data, followersPubkey]);
  // Filter notes based on the search query
  useEffect(() => {
    filteredNotes();
    // console.log('Filtered notes:', filtered);
    // setFeedData(filtered as any);
    // console.log('feed data is => ', filtered);
  }, [notes.data?.pages, search, activeSortBy]);

  useEffect(() => {
    // const filtered = filteredNotes();
    // setFeedData(filtered as any);
    // filteredNotes();
    if (publicKey && contacts?.data?.length && contacts?.data?.length > 0 || followersPubkey?.length && followersPubkey?.length > 0) {
      setForYouNotes(notesForYou?.data?.pages?.flat() as any);
    }
  }, [followersPubkey, contacts, notesForYou, publicKey])


  const handleNavigate = (id: string) => {
    navigation.navigate('WatchStream', { streamId: id });
  };

  const handleNavigateToStreamView = (id: string) => {
    navigation.navigate('ViewStreamGuest', { streamId: id });
  };
  const { handleCheckNostrAndSendConnectDialog } = useNostrAuth();

  const handleConnect = async () => {
    // navigation.navigate('MainStack', { screen: 'Settings' });
    await handleCheckNostrAndSendConnectDialog()
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

      {activeSortBy === SORT_OPTION_EVENT_NOSTR.FOR_YOU?.toString() && !publicKey && (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>No users connected</Text>
          <Button onPress={handleConnect}>
            Connect
          </Button>
        </View>
      )}


      {
        publicKey &&
        activeSortBy === SORT_OPTION_EVENT_NOSTR.FOR_YOU?.toString() || forYouNotes?.length == 0 && !notesForYou?.isFetching
        && notesForYou?.data?.pages?.length == 0
        && !notesForYou?.isFetching
        && (
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
        data={activeSortBy === SORT_OPTION_EVENT_NOSTR.FOR_YOU?.toString() ? forYouNotes : feedData}
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
        onEndReached={() => {
          if (activeSortBy === SORT_OPTION_EVENT_NOSTR.FOR_YOU?.toString()) {
            notesForYou.fetchNextPage();
          }
          else if (activeSortBy === SORT_OPTION_EVENT_NOSTR.TRENDING?.toString()) {
            notes.fetchNextPage();
            notesForYou.fetchNextPage();
          } else {
            notes.fetchNextPage();
          }
        }}
      // onEndReached={() => notes.fetchNextPage()}
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
