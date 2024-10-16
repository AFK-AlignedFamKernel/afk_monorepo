import { NostrEvent } from '@nostr-dev-kit/ndk';
import { useGetVideos } from 'afk_nostr_sdk';
import React, { useMemo, useRef, useState } from 'react';
import { FlatList, Text, View } from 'react-native';

import { InfoIcon } from '../../assets/icons';
import NostrVideo from '../../components/NostrVideo';
import { useStyles, useTheme } from '../../hooks';
import { mockEvents } from '../../utils/dummyData';
import stylesheet from './styles';

const ShortVideosModule = () => {
  const styles = useStyles(stylesheet);
  const { theme } = useTheme();
  const [currentViewableItemIndex, setCurrentViewableItemIndex] = useState(0);
  const viewabilityConfig = { viewAreaCoveragePercentThreshold: 50 };
  const videos = useGetVideos();
  const [videosEventsState, setVideosEvents] = useState<NostrEvent[]>(
    videos?.data?.pages?.flat() as NostrEvent[],
  );

  const videosEvents = useMemo(() => {
    return videos?.data?.pages?.flat() as NostrEvent[]
  }, [videos?.data?.pages])

  const fetchNostrEvents = async () => {
    // This mock should be replaced with actual implementation (hook integration to get videos)
    setVideosEvents(mockEvents);
  };

  const onViewableItemsChanged = ({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentViewableItemIndex(viewableItems[0].index ?? 0);
    }
  };

  const viewabilityConfigCallbackPairs = useRef([{ viewabilityConfig, onViewableItemsChanged }]);

  return (
    <View style={styles.container}>
      {videosEvents.length > 0 ? (
        <FlatList
          style={styles.list}
          data={videosEvents}
          renderItem={({ item, index }) => (
            <NostrVideo item={item} shouldPlay={index === currentViewableItemIndex} />
          )}
          keyExtractor={(item, index) => item.content + index}
          pagingEnabled
          horizontal={false}
          showsVerticalScrollIndicator={false}
          viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
        />
      ) : (
        <View style={styles.noDataContainer}>
          <InfoIcon width={30} height={30} color={theme.colors.primary} />
          <Text style={styles.noDataText}>No videos uploaded yet.</Text>
        </View>
      )}
    </View>
  );
};

export default ShortVideosModule;
