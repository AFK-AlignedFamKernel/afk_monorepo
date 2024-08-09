import {NDKEvent, NDKKind} from '@nostr-dev-kit/ndk';
import {useState} from 'react';
import {FlatList, Image, Pressable, RefreshControl, ScrollView, View} from 'react-native';

import {AddPostIcon} from '../../assets/icons';
import {Header} from '../../components';
import {BubbleUser} from '../../components/BubbleUser';
import SearchComponent from '../../components/search';
import {useStyles, useTheme} from '../../hooks';
import {ChannelComponent} from '../../modules/ChannelCard';
import {PostCard} from '../../modules/PostCard';
import {SearchScreenProps} from '../../types';
import {SelectedTab} from '../../types/tab';
import stylesheet from './styles';
import { useSearchNotes , useAllProfiles} from 'afk_nostr_sdk'

export const Search: React.FC<SearchScreenProps> = ({navigation}) => {
  const {theme} = useTheme();
  const styles = useStyles(stylesheet);

  const [search, setSearch] = useState<string | undefined>(undefined);
  const [kindSelected, setKindSelected] = useState<NDKKind | undefined>(NDKKind.Text);
  const [kindsArray, setKindsSelected] = useState<NDKKind[]>([]);
  // const notes = useSearchNotes({ search: search, kinds: [NDKKind.Text, NDKKind.ChannelCreation, NDKKind.GroupChat, NDKKind.ChannelMessage] });
  const notes = useSearchNotes({
    // search: search,
    kinds: [NDKKind.Text, NDKKind.ChannelCreation, NDKKind.GroupChat, NDKKind.ChannelMessage],
  });

  // const profiles = useAllProfiles({
  //   // search: search
  // });
  const profiles = useAllProfiles();
  console.log('profiles', profiles?.data?.pages);

  function filterEventsByContent(events: NDKEvent[], search: string) {
    const regex = new RegExp(search, 'i'); // Case-insensitive search
    return events.filter((event) => regex.test(event?.content));
  }

  const [selectedTab, setSelectedTab] = useState<SelectedTab | undefined>(SelectedTab.NOTES);
  const handleTabSelected = (tab: string | SelectedTab, screen?: string) => {
    setSelectedTab(tab as any);
    if (screen) {
      navigation.navigate(screen as any);
    }
  };

  // const eventsFiltered = useMemo(() => {
  //   if (!notes?.data?.pages ) return [];
  //   if(!search) {
  //     return notes?.data?.pages;
  //   }
  //   return filterEventsByContent(notes?.data?.pages, search)

  // }, [notes])

  const profilesSearch = profiles?.data?.pages?.flat() ?? [];
  return (
    <View style={styles.container}>
      <Image
        style={styles.backgroundImage}
        // source={require('../../assets/feed-background.png')}
        source={require('../../assets/feed-background-afk.png')}
        resizeMode="cover"
      />

      <Header />
      {/* <TabSelector activeTab={selectedTab} handleActiveTab={handleTabSelected} buttons={TABS_LIST_SEARCH} addScreenNavigation={false} /> */}
      <SearchComponent setSearchQuery={setSearch} searchQuery={search}></SearchComponent>

      <View
        style={{
          alignItems: 'center', // Ensure the tabs are vertically centered
          paddingVertical: 5,
          flexDirection: 'row',
        }}
      >
        <ScrollView
          contentContainerStyle={styles.stories}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {profilesSearch.map((item: NDKEvent, i:number) => {
            console.log('item profile', item);
            console.log('search', search);
            if (search && search?.length > 0 && item?.content?.includes(search)) {
              return <BubbleUser key={i} event={item} />;
            } else if (!search || search?.length == 0) {
              return <BubbleUser key={i} event={item} />;
            }
            return <></>;
          })}
        </ScrollView>
      </View>

      <FlatList
        contentContainerStyle={styles.flatListContent}
        data={notes.data?.pages.flat()}
        // data={eventsFiltered}
        keyExtractor={(item) => item?.id}
        renderItem={({item}) => {
          if (!item?.content?.includes(search) && search && search?.length > 0) return <></>;
          if (item?.kind == NDKKind.ChannelCreation || item?.kind == NDKKind.ChannelMetadata) {
            return <ChannelComponent event={item} />;
          } else if (item?.kind == NDKKind.Metadata) {
            return <BubbleUser event={item} />;
          }
          return <PostCard event={item} />;
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
        <AddPostIcon width={72} height={72} color={theme.colors.red} />
      </Pressable>
    </View>
  );
};
