import { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk';
import { useAllProfiles, useGetLabels, useNostrContext, useProfile, useSearch, useSearchSince } from 'afk_nostr_sdk';
import { useAuth, useContacts } from 'afk_nostr_sdk';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, View, Text } from 'react-native';

import { AddPostIcon } from '../../assets/icons';
import { BubbleUser } from '../../components/BubbleUser';
import SearchComponent from '../../components/search';
import { useNostrAuth, useStyles, useTheme } from '../../hooks';
import { ChannelComponent } from '../ChannelCard';
import { PostCard } from '../PostCard';
import { VideoPostCard } from '../VideoPostCard';
import { FeedScreenProps, MainStackNavigationProps } from '../../types';
import stylesheet from './styles';
import { SORT_OPTIONS, SORT_OPTION_EVENT_NOSTR } from '../../types/nostr';
import { RenderEventCard } from '../Studio';
import { Button } from '../../components';
import { useNavigation } from '@react-navigation/native';
import { ArticleCard } from '../ArticleCard';
import ArticleSearchComponent from 'src/components/search/ArticleSearch';

export const LabelsComponent: React.FC = () => {

  const navigation = useNavigation<MainStackNavigationProps>();
  const { theme } = useTheme();
  const { publicKey } = useAuth();
  const { ndk } = useNostrContext();
  const styles = useStyles(stylesheet);
  const profiles = useAllProfiles({ limit: 10 });
  const myLabels = useGetLabels({
    authors: [publicKey],
    kinds: [NDKKind.Label],
    limit: 10,
  });
  console.log("myLabels", myLabels);
  const labels = useGetLabels({
    kinds: [NDKKind.Label],
    limit: 100,
  });
  console.log("labels", labels);
  const [activeSortBy, setSortBy] = useState<string | undefined>(SORT_OPTION_EVENT_NOSTR.TIME?.toString());
  const [search, setSearch] = useState<string | undefined>(undefined);
  const [feedData, setFeedData] = useState(null);
  const [kinds, setKinds] = useState<NDKKind[]>([
    // NDKKind.Text,
    // NDKKind.ChannelMessage,
    // NDKKind.Metadata,
    // NDKKind.VerticalVideo,
    // NDKKind.HorizontalVideo,
    // 30311 as NDKKind,
    // NDKKind.ChannelCreation,
    // NDKKind.GroupChat,
    NDKKind.Article,
  ]);


  const [followersPubkey, setFollowersPubkey] = useState<string[]>([]);
  const profile = useProfile({ publicKey });
  const contacts = useContacts({ authors: [publicKey] });
  const notes = useSearchSince({
    limit: 10,
    // since: Math.round(Date.now() / 1000) - 1 * 1000 * 60 * 60 * 24 * 30,
    kinds,

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


  console.log('articlesfeedData', feedData);
  return (
    <View style={styles.container}>
      <ArticleSearchComponent
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

      {/* {activeSortBy === SORT_OPTION_EVENT_NOSTR.FOR_YOU?.toString() && !publicKey && (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>No users connected</Text>
          <Button onPress={handleConnect}>
            Connect
          </Button>
        </View>
      )} */}


      <FlatList

        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}

        horizontal={true}
        contentContainerStyle={styles.flatListContent}
        // data={feedData}
        data={labels?.data?.pages?.flat() ?? []}
        // data={filteredNotes}
        keyExtractor={(item) => item?.id}
        renderItem={({ item }) => {

          const labelNamespaces: string[] = item?.tags?.find((tag: string[]) => tag[0] === 'L');
          const labelNamespace= labelNamespaces?.length > 0 ? labelNamespaces[1] : undefined;
         
          const labelNames: string[] = item?.tags?.find((tag: string[]) => tag[0] === 'l');
          const labelName = labelNames?.length > 0 ? labelNames[1] : undefined;
          console.log("labelNamespace", labelNamespace);
          console.log("labelName", labelName);

          return (
            <>
              <View>
                {labelNamespace && labelNamespace != "#t" &&

                  <Text style={styles.text}>{labelNamespace}</Text>

                }
                {labelName &&
                  <Text style={styles.text}>{labelName}</Text>

                }

              </View>
            </>
          )
        }}
        refreshControl={
          <RefreshControl refreshing={notes.isFetching} onRefresh={() => notes.refetch()} />
        }
        onEndReached={() => {
          labels.fetchNextPage();

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
