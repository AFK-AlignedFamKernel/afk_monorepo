import { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk';
import { useAllProfiles, useGetLabels, useNostrContext, useProfile, useSearch, useSearchSince } from 'afk_nostr_sdk';
import { useAuth, useContacts } from 'afk_nostr_sdk';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, View, Text } from 'react-native';

import { AddPostIcon } from '../../assets/icons';
import { useNostrAuth, useStyles, useTheme } from '../../hooks';
import { FeedScreenProps, MainStackNavigationProps } from '../../types';
import stylesheet from '../Feed/styles';
import { SORT_OPTIONS, SORT_OPTION_EVENT_NOSTR } from '../../types/nostr';
import { RenderEventCard } from '../Studio';
import { Button } from '../../components';
import { useNavigation } from '@react-navigation/native';
import { ArticleCard } from '../ArticleCard';
import ArticleSearchComponent from 'src/components/search/ArticleSearch';
import { LabelsComponent } from './LabelsComponent';
import { TagsComponent } from 'src/screens/Tags/TagsComponent';
import { TAGS_DEFAULT } from 'common';
export const LabelFeed: React.FC = () => {

  const navigation = useNavigation<MainStackNavigationProps>();
  const { theme } = useTheme();
  const { publicKey } = useAuth();
  const { ndk } = useNostrContext();
  const styles = useStyles(stylesheet);
  const profiles = useAllProfiles({ limit: 10 });

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

  const filteredNotes = async () => {
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
        notes?.data?.pages?.filter((item) =>
          [...followers]?.flat()?.some((n) => item?.pubkey === n?.pubkey)
        ) ?? [];

      // notes.data?.pages.flat().filter((item) => item?.pubkey === contacts?.data[0]) ?? [];
      console.log('forYouNotes', forYouNotes);

      forYouNotes = forYouNotes?.filter((item) => {
        if (item && item?.pubkey) return item;
      }
      ) ?? [];
      console.log('forYouNotes', forYouNotes);

      setFeedData(forYouNotes as any);
      setForYouNotes([...forYouNotes, ...notesForYou?.data?.pages?.flat() as any]);
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
    // }, [notes.data?.pages, search, activeSortBy, publicKey, contacts?.data, followersPubkey]);
  };

  const filtedNotesCallback = useCallback(async () => {
    return filteredNotes();
  }, [notes.data?.pages, search, activeSortBy, publicKey, contacts?.data, followersPubkey]);

  // Filter notes based on the search query
  useEffect(() => {
    filteredNotes();
  }, [notes.data?.pages, search, activeSortBy]);

  const { handleCheckNostrAndSendConnectDialog } = useNostrAuth();

  const handleConnect = async () => {
    // navigation.navigate('MainStack', { screen: 'Settings' });
    await handleCheckNostrAndSendConnectDialog()
  };

  const [labelsEvents, setLabelsEvents] = useState<NDKEvent[]>([]);
  const [labelsNamespaces, setLabelsNamespaces] = useState<string[]>([]);
  const [labelsNames, setLabelsNames] = useState<string[]>(TAGS_DEFAULT);
  const [myLabels, setMyLabels] = useState<NDKEvent[]>([]);
  const [selectedLabel, setSelectedLabel] = useState<string | undefined>("bitcoin");
  const [selectedLabelNamespace, setSelectedLabelNamespace] = useState<string | undefined>("bitcoin");

  return (
    <View style={styles.container}>

      <LabelsComponent
        labelsEventsProps={labelsEvents}
        labelsNamespacesProps={labelsNamespaces}
        labelsNamesProps={labelsNames}
        setLabelsNamespacesProps={setLabelsNamespaces}
        setLabelsNamesProps={setLabelsNames}
        setMyLabelsProps={setMyLabels}
        selectedLabelProps={selectedLabel}
        setSelectedLabelProps={setSelectedLabel}
        selectedLabelNamespaceProps={selectedLabelNamespace}
        setSelectedLabelNamespaceProps={setSelectedLabelNamespace}
        isInternalLabelFeedProps={true}
      />


      {/* <TagsComponent tagName={selectedLabel} /> */}

      <Pressable
        style={styles.createPostButton}
        onPress={() => navigation.navigate('MainStack', { screen: 'CreateForm' })}
      >
        <AddPostIcon width={72} height={72} color={theme.colors.primary} />
      </Pressable>
    </View>
  );
};
