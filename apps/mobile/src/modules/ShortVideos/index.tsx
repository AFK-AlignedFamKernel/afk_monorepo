import { NostrEvent } from '@nostr-dev-kit/ndk';
import { useGetVideos } from 'afk_nostr_sdk';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, RefreshControl, Text, View } from 'react-native';

import { InfoIcon } from '../../assets/icons';
import NostrVideo from '../../components/NostrVideo';
import { useStyles, useTheme } from '../../hooks';
import { mockEvents } from '../../utils/dummyData';
import stylesheet from './styles';

const ShortVideosModule = () => {
  const styles = useStyles(stylesheet);
  const { theme } = useTheme();
  const [currentViewableItemIndex, setCurrentViewableItemIndex] = useState(0);
  const { height: WINDOW_HEIGHT, width: WINDOW_WIDTH } = Dimensions.get('window');

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 300,
  };

  const videos = useGetVideos({ limit: 10 });
  const [videosEventsState, setVideosEvents] = useState<NostrEvent[]>(
    videos?.data?.pages?.flat() as NostrEvent[],
  );

  console.log("videosEventsState", videosEventsState)

  const videosEvents = useMemo(() => {
    console.log("videosEvents", videos?.data?.pages?.flat())
    // setVideosEvents(videos?.data?.pages?.flat() as NostrEvent[])
    return videos?.data?.pages?.flat() as NostrEvent[];
  }, [videos, videos?.data?.pages]);


  useEffect(() => {
    setVideosEvents(videos?.data?.pages?.flat() as NostrEvent[])
  }, [videos?.data?.pages])

  console.log("videosEvents", videosEvents)

  const fetchNostrEvents = async () => {
    // This mock should be replaced with actual implementation (hook integration to get videos)
    setVideosEvents(mockEvents);
  };

  const onViewableItemsChanged = ({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentViewableItemIndex(viewableItems[0].index ?? 0);
    }
  };

  const getItemLayout = (_: any, index: number) => ({
    length: WINDOW_HEIGHT,
    offset: WINDOW_HEIGHT * index,
    index,
  });

  const viewabilityConfigCallbackPairs = useRef([{ viewabilityConfig, onViewableItemsChanged }]);

  return (
    <View style={[styles.container, { height: WINDOW_HEIGHT }]}>

      {videos?.isFetching && !videos.isLoading && <ActivityIndicator />}
      {/* <View style={styles.noDataContainer}>
          <InfoIcon width={30} height={30} color={theme.colors.primary} />
          <Text style={styles.noDataText}>No videos uploaded yet.</Text>
        </View> */}
      {videosEventsState.length > 0 && (
        <FlatList
          style={styles.list}
          data={videosEventsState}
          renderItem={({ item, index }) => (
            <View style={[styles.videoContainer, { height: WINDOW_HEIGHT - 60, width: WINDOW_WIDTH }]}>
              <NostrVideo
                item={item}
                shouldPlay={index === currentViewableItemIndex}
              // shouldPlay={true}

              // onPlay={() => {
              //   console.log("play")
              // }}
              // onPause={() => {
              //   console.log("pause")
              // }}

              />
            </View>
          )}
          keyExtractor={(item, index) => item.content + index}
          pagingEnabled
          snapToInterval={WINDOW_HEIGHT}
          snapToAlignment="start"
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          getItemLayout={getItemLayout}
          viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
          onEndReached={() => {
            console.log("loading more videos")
            videos?.fetchNextPage();
          }}
          refreshControl={
            <RefreshControl refreshing={videos?.isFetching} onRefresh={() => videos?.refetch()} />
          }
        />
      )}
    </View>
  );
};

export default ShortVideosModule;
