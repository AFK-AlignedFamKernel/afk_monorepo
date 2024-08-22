import { NDKKind } from '@nostr-dev-kit/ndk';
import { useAllProfiles, useSearchNotes } from 'afk_nostr_sdk';
import { useState } from 'react';
import { FlatList, Image, Pressable, RefreshControl, View } from 'react-native';

import { AddPostIcon } from '../../assets/icons';
import { BubbleUser } from '../../components/BubbleUser';
import SearchComponent from '../../components/search';
import { useStyles, useTheme } from '../../hooks';
import { ChannelComponent } from '../../modules/ChannelCard';
import { PostCard } from '../../modules/PostCard';
import { FeedScreenProps } from '../../types';
import stylesheet from './styles';
import { UserCard } from '../../modules/UserCard';

export const Feed: React.FC<FeedScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = useStyles(stylesheet);
  const profiles = useAllProfiles();
  const [search, setSearch] = useState<string | undefined>(undefined);
  // const notes = useRootNotes();
  const [isAllKinds, setIsAllKinds] = useState(false);
  const [isFilterOpen, setISFilterOpen] = useState(false);
  const [isOpenProfile, setIsOpenProfile] = useState(false);
  const [kinds, setKinds] = useState<NDKKind[]>([
    NDKKind.Text,
    NDKKind.ChannelCreation,
    NDKKind.GroupChat,
    NDKKind.ChannelMessage,
    NDKKind.Metadata,
  ]);
  const notes = useSearchNotes({
    // search: search,
    kinds,
  });

  const profilesSearch =
    profiles?.data?.pages?.flat().map((item) => {
      item?.content?.includes(search) && search && search?.length > 0;
    }) ?? [];

  return (
    <View style={styles.container}>
      <Image
        style={styles.backgroundImage}
        // source={require('../../assets/feed-background.png')}
        source={require('../../assets/feed-background-afk.png')}
        resizeMode="cover"
      />

      {/* <Header /> */}

      {/* <View
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
          {profilesSearch.map((item, i) => {
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
      </View> */}

      <SearchComponent setSearchQuery={setSearch} searchQuery={search}></SearchComponent>

      {/* Todo todo filter for trending, latest etc */}

      <FlatList
        ListHeaderComponent={
          <FlatList
            contentContainerStyle={styles.stories}
            horizontal
            data={profiles.data?.pages.flat()}
            showsHorizontalScrollIndicator={false}
            onEndReached={() => profiles.fetchNextPage()}
            refreshControl={
              <RefreshControl
                refreshing={profiles.isFetching}
                onRefresh={() => profiles.refetch()}
              />
            }
            // data={stories}
            ItemSeparatorComponent={() => <View style={styles.storySeparator} />}
            renderItem={({ item }) => {
              if (!item?.content?.includes(search) && search && search?.length > 0) return <></>;
              return (
                <BubbleUser
                  // name={item.name}
                  // image={item.img}
                  event={item}
                />
              );
            }}
          />
        }
        contentContainerStyle={styles.flatListContent}
        data={notes.data?.pages.flat()}
        keyExtractor={(item) => item?.id}
        renderItem={({ item }) => {
          if (!item?.content?.includes(search) && search && search?.length > 0) return <></>;
          if (item?.kind == NDKKind.ChannelCreation || item?.kind == NDKKind.ChannelMetadata) {
            return <ChannelComponent event={item} />;
          }
          // else if (item?.kind == NDKKind.Metadata) {
          //   return <UserCard event={item} />;
          // }
          else if (item?.kind == NDKKind.Text) {
            return <PostCard event={item} />;
          }
          return <></>
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
