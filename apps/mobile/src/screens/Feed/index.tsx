import { FlatList, Image, Pressable, RefreshControl, ScrollView, View } from 'react-native';

import { AddPostIcon } from '../../assets/icons';
import { Header } from '../../components';
import { BubbleUser } from '../../components/BubbleUser';
import { useStyles, useTheme } from '../../hooks';
import { PostCard } from '../../modules/PostCard';
import { FeedScreenProps } from '../../types';
import stylesheet from './styles';
import { useState } from 'react';
import SearchComponent from '../../components/search';
import { ChannelComponent } from '../../modules/ChannelCard';
import { NDKKind } from '@nostr-dev-kit/ndk';
import { useSearchNotes, useRootNotes, useAllProfiles } from "afk_nostr_sdk"

export const Feed: React.FC<FeedScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = useStyles(stylesheet);
  const profiles = useAllProfiles();
  const [search, setSearch] = useState<string | undefined>(undefined);
  // const notes = useRootNotes();
  const notes = useSearchNotes({
    // search: search,
    kinds: [NDKKind.Text, NDKKind.ChannelCreation, NDKKind.GroupChat, NDKKind.ChannelMessage],
  });

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

      <FlatList
        ListHeaderComponent={
          <FlatList
            contentContainerStyle={styles.stories}
            horizontal
            data={profiles.data?.pages.flat()}
            showsHorizontalScrollIndicator={false}
            onEndReached={() => profiles.fetchNextPage()}
            refreshControl={
              <RefreshControl refreshing={profiles.isFetching} onRefresh={() => profiles.refetch()} />
            }
            // data={stories}
            ItemSeparatorComponent={() => <View style={styles.storySeparator} />}
            renderItem={({ item }) => (
              <BubbleUser
                // name={item.name}
                // image={item.img}
                event={item}
              />
            )}
          />
        }
        contentContainerStyle={styles.flatListContent}
        data={notes.data?.pages.flat()}
        keyExtractor={(item) => item?.id}
        renderItem={({ item }) => {
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
        onPress={() => navigation.navigate('MainStack', { screen: 'CreateForm' })}
      >
        <AddPostIcon width={72} height={72}
          color={theme.colors.primary}
        />
      </Pressable>
    </View>
  );
};
