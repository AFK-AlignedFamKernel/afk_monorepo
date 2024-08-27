import {NDKKind} from '@nostr-dev-kit/ndk';
import {useAllProfiles, useSearchNotes} from 'afk_nostr_sdk';
import {useState} from 'react';
import {FlatList, Image, Pressable, RefreshControl, View} from 'react-native';

import {AddPostIcon} from '../../assets/icons';
import {BubbleUser} from '../../components/BubbleUser';
import SearchComponent from '../../components/search';
import {useStyles, useTheme} from '../../hooks';
import {ChannelComponent} from '../../modules/ChannelCard';
import {PostCard} from '../../modules/PostCard';
import {FeedScreenProps} from '../../types';
import stylesheet from './styles';

export const Feed: React.FC<FeedScreenProps> = ({navigation}) => {
  const {theme} = useTheme();
  const styles = useStyles(stylesheet);
  const profiles = useAllProfiles();
  const [search, setSearch] = useState<string | undefined>(undefined);
  const [kinds, setKinds] = useState<NDKKind[]>([
    NDKKind.Text,
    NDKKind.ChannelCreation,
    NDKKind.GroupChat,
    NDKKind.ChannelMessage,
    NDKKind.Metadata,
  ]);

  const notes = useSearchNotes({
    kinds,
  });

  // Filter profiles based on the search query
  const profilesSearch =
    profiles?.data?.pages
      ?.flat()
      .filter((item) => (search && search?.length > 0 ? item?.content?.includes(search) : true)) ??
    [];

  const filteredNotes = notes.data?.pages
    .flat()
    .filter((item) => (search && search?.length > 0 ? item?.content?.includes(search) : true));

  const combinedData = [...(profilesSearch ?? []), ...(filteredNotes ?? [])];

  return (
    <View style={styles.container}>
      <Image
        style={styles.backgroundImage}
        source={require('../../assets/feed-background-afk.png')}
        resizeMode="cover"
      />

      <SearchComponent
        setSearchQuery={setSearch}
        searchQuery={search ?? ''}
        kinds={kinds}
        setKinds={setKinds}
        contactList={profilesSearch.map((item) => item?.id)}
      />

      <FlatList
        contentContainerStyle={styles.flatListContent}
        data={combinedData}
        keyExtractor={(item) => item?.id}
        renderItem={({item}) => {
          if (item.kind === undefined) {
            return <BubbleUser event={item} />;
          } else if (
            item.kind === NDKKind.ChannelCreation ||
            item.kind === NDKKind.ChannelMetadata
          ) {
            return <ChannelComponent event={item} />;
          } else if (item.kind === NDKKind.Text) {
            return <PostCard event={item} />;
          }
          return <></>;
        }}
        refreshControl={
          <RefreshControl
            refreshing={notes.isFetching || profiles.isFetching}
            onRefresh={() => {
              notes.refetch();
              profiles.refetch();
            }}
          />
        }
        onEndReached={() => {
          notes.fetchNextPage();
          profiles.fetchNextPage();
        }}
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
