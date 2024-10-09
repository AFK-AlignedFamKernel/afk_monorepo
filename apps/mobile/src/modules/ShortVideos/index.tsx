import {NostrEvent} from '@nostr-dev-kit/ndk';
import React, {useEffect, useRef, useState} from 'react';
import {FlatList, View} from 'react-native';

import NostrVideo from '../../components/NostrVideo';
import {useStyles} from '../../hooks';
import stylesheet from './styles';

const ShortVideosModule = () => {
  const styles = useStyles(stylesheet);
  const [videosEvents, setVideosEvents] = useState<NostrEvent[]>([]);
  const [currentViewableItemIndex, setCurrentViewableItemIndex] = useState(0);
  const viewabilityConfig = {viewAreaCoveragePercentThreshold: 50};

  useEffect(() => {
    fetchNostrEvents();
  }, []);

  const fetchNostrEvents = async () => {
    // This mock should be replaced with actual implementation (hook integration to get videos)
    const mockEvents: NostrEvent[] = [
      {
        id: 'b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1',
        pubkey: 'b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1',
        created_at: 1696867200,
        kind: 34236,
        content: 'Tutorial: How to make the perfect cappuccino at home',
        tags: [
          ['d', '660f9511-f3a1-52e5-b827-557766551111'],
          ['title', 'Perfect Home Cappuccino Tutorial'],
          ['thumb', 'https://example.com/thumbnails/cappuccino_tutorial.jpg'],
          ['published_at', '1696867200'],
          [
            'alt',
            'Step-by-step video guide showing how to make a cappuccino using a home espresso machine',
          ],
          [
            'url',
            'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          ],
          ['m', 'video/mp4'],
          ['x', '3dg35eba6gc1b41f37f94c3bd6a9f40f2c272f6d2ga536f84154473049c9935'],
          ['size', '52428800'],
          ['duration', '480'],
          ['dim', '1920x1080'],
          ['p', 'e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3d4', 'wss://relay.coffee.com'],
          ['t', 'coffee'],
          ['t', 'tutorial'],
          ['t', 'cappuccino'],
          ['r', 'https://example.com/blog/coffee-making-tips'],
        ],
      },
      {
        id: 'c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2',
        pubkey: 'c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2',
        created_at: 1696953600,
        kind: 34235,
        content: 'Drone footage of the Amazon rainforest',
        tags: [
          ['d', '770g0622-g4b2-63f6-c938-668877662222'],
          ['title', 'Amazon Rainforest Aerial View'],
          ['thumb', 'https://example.com/thumbnails/amazon_drone.jpg'],
          ['published_at', '1696953600'],
          [
            'alt',
            'Breathtaking aerial footage of the Amazon rainforest, showcasing its vast expanse and diverse ecosystem',
          ],
          [
            'url',
            'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
          ],
          ['m', 'video/mp4'],
          ['x', '4eh46fca7hd2c52g48ga5d4ce7bg51g3d383g7e3hb647g265584150da0a46'],
          ['size', '104857600'],
          ['duration', '300'],
          ['dim', '3840x2160'],
          ['p', 'f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3d4e5', 'wss://relay.nature.com'],
          ['t', 'amazon'],
          ['t', 'rainforest'],
          ['t', 'drone'],
          ['t', 'nature'],
          ['r', 'https://example.com/article/amazon-conservation'],
          ['content-warning', 'May contain scenes of deforestation'],
        ],
      },
      {
        id: 'd4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3',
        pubkey: 'd4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3',
        created_at: 1697040000,
        kind: 34235,
        content: 'Live stream recording: SpaceX Starship launch attempt',
        tags: [
          ['d', '880h1733-h5c3-74g7-d049-779988773333'],
          ['title', 'SpaceX Starship Launch - Live Recording'],
          ['thumb', 'https://example.com/thumbnails/spacex_starship.jpg'],
          ['published_at', '1697040000'],
          [
            'alt',
            'Recorded live stream of SpaceX Starship launch attempt, including pre-launch preparations and commentary',
          ],
          [
            'url',
            'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          ],
          ['m', 'video/mp4'],
          ['x', '5fi57gdb8ie3d63h59hb6e5df8ch62h4e494h8f4ic758h376695261eb1b57'],
          ['size', '2147483648'],
          ['duration', '7200'],
          ['dim', '3840x2160'],
          ['p', 'g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3d4e5f6', 'wss://relay.space.com'],
          ['p', 'h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3d4e5f6g7', 'wss://relay.spacex.com'],
          ['t', 'spacex'],
          ['t', 'starship'],
          ['t', 'space'],
          ['t', 'livestream'],
          ['r', 'https://www.spacex.com/launches/'],
          [
            'segment',
            '0',
            '600',
            'Pre-launch preparations',
            'https://example.com/thumbnails/spacex_prep.jpg',
          ],
          [
            'segment',
            '600',
            '6600',
            'Launch attempt',
            'https://example.com/thumbnails/spacex_launch.jpg',
          ],
          [
            'segment',
            '6600',
            '7200',
            'Post-launch analysis',
            'https://example.com/thumbnails/spacex_analysis.jpg',
          ],
        ],
      },
      {
        id: 'd4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3',
        pubkey: 'd4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3',
        created_at: 1697040000,
        kind: 34235,
        content: 'Live stream recording: SpaceX Starship launch attempt',
        tags: [
          ['d', '880h1733-h5c3-74g7-d049-779988773333'],
          ['title', 'SpaceX Starship Launch - Live Recording'],
          ['thumb', 'https://example.com/thumbnails/spacex_starship.jpg'],
          ['published_at', '1697040000'],
          [
            'alt',
            'Recorded live stream of SpaceX Starship launch attempt, including pre-launch preparations and commentary',
          ],
          [
            'url',
            'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
          ],
          ['m', 'video/mp4'],
          ['x', '5fi57gdb8ie3d63h59hb6e5df8ch62h4e494h8f4ic758h376695261eb1b57'],
          ['size', '2147483648'],
          ['duration', '7200'],
          ['dim', '3840x2160'],
          ['p', 'g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3d4e5f6', 'wss://relay.space.com'],
          ['p', 'h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3d4e5f6g7', 'wss://relay.spacex.com'],
          ['t', 'spacex'],
          ['t', 'starship'],
          ['t', 'space'],
          ['t', 'livestream'],
          ['r', 'https://www.spacex.com/launches/'],
          [
            'segment',
            '0',
            '600',
            'Pre-launch preparations',
            'https://example.com/thumbnails/spacex_prep.jpg',
          ],
          [
            'segment',
            '600',
            '6600',
            'Launch attempt',
            'https://example.com/thumbnails/spacex_launch.jpg',
          ],
          [
            'segment',
            '6600',
            '7200',
            'Post-launch analysis',
            'https://example.com/thumbnails/spacex_analysis.jpg',
          ],
        ],
      },
      {
        id: 'd4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3',
        pubkey: 'd4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3',
        created_at: 1697040000,
        kind: 34235,
        content: 'Live stream recording: SpaceX Starship launch attempt',
        tags: [
          ['d', '880h1733-h5c3-74g7-d049-779988773333'],
          ['title', 'SpaceX Starship Launch - Live Recording'],
          ['thumb', 'https://example.com/thumbnails/spacex_starship.jpg'],
          ['published_at', '1697040000'],
          [
            'alt',
            'Recorded live stream of SpaceX Starship launch attempt, including pre-launch preparations and commentary',
          ],
          [
            'url',
            'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
          ],
          ['m', 'video/mp4'],
          ['x', '5fi57gdb8ie3d63h59hb6e5df8ch62h4e494h8f4ic758h376695261eb1b57'],
          ['size', '2147483648'],
          ['duration', '7200'],
          ['dim', '3840x2160'],
          ['p', 'g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3d4e5f6', 'wss://relay.space.com'],
          ['p', 'h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3d4e5f6g7', 'wss://relay.spacex.com'],
          ['t', 'spacex'],
          ['t', 'starship'],
          ['t', 'space'],
          ['t', 'livestream'],
          ['r', 'https://www.spacex.com/launches/'],
          [
            'segment',
            '0',
            '600',
            'Pre-launch preparations',
            'https://example.com/thumbnails/spacex_prep.jpg',
          ],
          [
            'segment',
            '600',
            '6600',
            'Launch attempt',
            'https://example.com/thumbnails/spacex_launch.jpg',
          ],
          [
            'segment',
            '6600',
            '7200',
            'Post-launch analysis',
            'https://example.com/thumbnails/spacex_analysis.jpg',
          ],
        ],
      },
    ];

    setVideosEvents(mockEvents);
  };

  const onViewableItemsChanged = ({viewableItems}: any) => {
    if (viewableItems.length > 0) {
      setCurrentViewableItemIndex(viewableItems[0].index ?? 0);
    }
  };

  const viewabilityConfigCallbackPairs = useRef([{viewabilityConfig, onViewableItemsChanged}]);

  return (
    <View style={styles.container}>
      <FlatList
        data={videosEvents}
        renderItem={({item, index}) => (
          <NostrVideo item={item} shouldPlay={index === currentViewableItemIndex} />
        )}
        keyExtractor={(item) => item.content}
        pagingEnabled
        horizontal={false}
        showsVerticalScrollIndicator={false}
        viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
      />
    </View>
  );
};

export default ShortVideosModule;
