import {useNavigation} from '@react-navigation/native';
import {FlatList, RefreshControl, View} from 'react-native';

import {BubbleUser} from '../../components/BubbleUser';
import {useStyles, useTheme} from '../../hooks';
import {useAllProfiles, useChannels, useRootNotes} from "afk_nostr_sdk"
import {ChannelComponent} from '../../modules/ChannelCard';
import {MainStackNavigationProps} from '../../types';
import stylesheet from './styles';

interface IChannelsFeedComponent {
  isStoryEnabled?: boolean;
}
export const ChannelsFeedComponent: React.FC<IChannelsFeedComponent> = ({isStoryEnabled}) => {
  const {theme} = useTheme();
  const styles = useStyles(stylesheet);
  const notes = useRootNotes();
  const profiles = useAllProfiles();
  const channels = useChannels();
  const navigation = useNavigation<MainStackNavigationProps>();

  return (
    <View style={styles.container}>
      {isStoryEnabled ? (
        <FlatList
          ListHeaderComponent={
            isStoryEnabled && (
              <FlatList
                contentContainerStyle={styles.stories}
                horizontal
                data={profiles.data?.pages.flat()}
                showsHorizontalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={styles.storySeparator} />}
                renderItem={({item}) => <BubbleUser event={item} />}
              />
            )
          }
          contentContainerStyle={styles.flatListContent}
          data={channels.data?.pages.flat()}
          keyExtractor={(item) => item?.id}
          renderItem={({item}) => <ChannelComponent event={item} />}
          refreshControl={
            <RefreshControl refreshing={channels.isFetching} onRefresh={() => channels.refetch()} />
          }
          onEndReached={() => channels.fetchNextPage()}
        />
      ) : (
        <FlatList
          contentContainerStyle={styles.flatListContent}
          data={channels.data?.pages.flat()}
          keyExtractor={(item) => item?.id}
          renderItem={({item}) => <ChannelComponent event={item} />}
          refreshControl={
            <RefreshControl refreshing={channels.isFetching} onRefresh={() => channels.refetch()} />
          }
          onEndReached={() => channels.fetchNextPage()}
        />
      )}
    </View>
  );
};
