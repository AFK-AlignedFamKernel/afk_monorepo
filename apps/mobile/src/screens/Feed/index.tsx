import { View } from 'react-native';
import { useStyles, useTheme } from '../../hooks';
import { FeedScreenProps } from '../../types';
import stylesheet from './styles';
import { FeedComponent } from '../../modules/Feed';
import { ScrollView } from 'react-native-gesture-handler';
import { Button } from '../../components';
import { useState } from 'react';
import { LaunchpadComponent } from '../Launchpad/LaunchpadComponent';
import ShortVideosModule from '../../modules/ShortVideos';
import { StudioModuleView } from '../../modules/Studio';
import { StudioModule } from '../../modules/Studio/StudioModule';

export const Feed: React.FC<FeedScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = useStyles(stylesheet);

  const [isFeed, setIsFeed] = useState(true);
  const [viewFeed, setViewFeed] = useState<
    'NOTES' | 'TOKENS' | "SHORTS" | "VIDEOS" | "STREAM"
  >('NOTES');

  return (
    <View style={styles.container}>

      <ScrollView

        style={styles.actionToggle}

        horizontal

        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        // style={{
        //   // direction: "ltr",
        //   // display: "flex",
        //   // flexWrap: "wrap",
        //   // minHeight: 50,
        //   // maxHeight: 90,
        //   // flexDirection: 'row',
        // }}
        contentContainerStyle={{
          flex: 1,
          alignItems: "flex-start",
          height: '100%',
          // minHeight: 50,
          // maxHeight: 90,
          justifyContent: "flex-start",
          flexDirection: 'row', gap: 10,
        }}

      >
        <Button style={[styles.toggleButton, viewFeed === 'NOTES' && styles.activeToggle]} onPress={() => setViewFeed('NOTES')}>Feed</Button>
        <Button style={[styles.toggleButton, viewFeed === 'SHORTS' && styles.activeToggle]} onPress={() => setViewFeed('SHORTS')}>Shorts</Button>
        <Button style={[styles.toggleButton, viewFeed === 'STREAM' && styles.activeToggle]} onPress={() => setViewFeed('STREAM')}>Stream</Button>
        {/* <Button onPress={() => setViewFeed('TOKENS')}>Tokens</Button> */}
        {/* <Button style={[styles.toggleButton, viewFeed === 'VIDEOS' && styles.activeToggle]} onPress={() => setViewFeed('VIDEOS')}>Videos</Button> */}

      </ScrollView>

      {viewFeed === 'NOTES' && <FeedComponent></FeedComponent>}

      {viewFeed === 'TOKENS' && <LaunchpadComponent></LaunchpadComponent>}

      {viewFeed === 'SHORTS' && <ShortVideosModule></ShortVideosModule>}

      {viewFeed === 'STREAM' && <StudioModule></StudioModule>}

    </View>
  );
};
