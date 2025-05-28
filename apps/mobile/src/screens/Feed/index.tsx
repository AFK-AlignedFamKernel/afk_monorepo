import { Pressable, View } from 'react-native';
import { useStyles, useTheme } from '../../hooks';
import { FeedScreenProps } from '../../types';
import stylesheet from './styles';
import { FeedComponent } from '../../modules/Feed';
import { ScrollView } from 'react-native-gesture-handler';
import { Button, Icon } from '../../components';
import { useState } from 'react';
import { LaunchpadComponent } from '../Launchpad/LaunchpadComponent';
import ShortVideosModule from '../../modules/ShortVideos';
import { StudioModuleView } from '../../modules/Studio';
import { StudioModule } from '../../modules/Studio/StudioModule';
import { logClickedEvent } from 'src/utils/analytics';
import { AddPostIcon } from 'src/assets/icons';
import { ArticlesFeed } from 'src/modules/Feed/ArticlesFeed';
import { LabelFeed } from 'src/modules/Label/LabelFeed';

export const Feed: React.FC<FeedScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = useStyles(stylesheet);

  const [isFeed, setIsFeed] = useState(true);
  const [viewFeed, setViewFeed] = useState<
    'NOTES' | 'TOKENS' | "SHORTS" | "VIDEOS" | "STREAM" | "ARTICLES" | "LABELS"
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
        <Button style={[styles.toggleButton, viewFeed === 'NOTES' && styles.activeToggle]} onPress={() => {
          setViewFeed('NOTES')
          logClickedEvent('Feed', "user_action", "feed_toggle")
        }}
        ><Icon name="FeedIcon" size={15} style={[{ marginRight: 5 }, viewFeed === "NOTES" && styles.activeIcon]}></Icon>Feed</Button>
        <Button style={[styles.toggleButton, viewFeed === 'SHORTS' && styles.activeToggle]} onPress={() => {
          setViewFeed('SHORTS')
          logClickedEvent('Shorts', "user_action", "feed_toggle")
        }}>
          <Icon name="VideoIcon" size={15} style={[{ marginRight: 5 }, viewFeed === "SHORTS" && styles.activeIcon]}></Icon>Shorts</Button>
        <Button style={[styles.toggleButton, viewFeed === 'STREAM' && styles.activeToggle]} onPress={() => {
          setViewFeed('STREAM')
          logClickedEvent('Stream', "user_action", "feed_toggle")

        }}>
          <Icon name="StreamIcon" size={15} style={[{ marginRight: 5 }, viewFeed === "STREAM" && styles.activeIcon]}></Icon>Stream</Button>


        <Button style={[styles.toggleButton, viewFeed === 'ARTICLES' && styles.activeToggle]} onPress={() => {
          setViewFeed('ARTICLES')
          logClickedEvent('Articles', "user_action", "feed_toggle")

        }}>
          <Icon name="ArticleIcon" size={15} style={[{ marginRight: 5, }, viewFeed === "ARTICLES" && styles.activeIcon]}></Icon>Articles</Button>
      
          <Button style={[styles.toggleButton, viewFeed === 'LABELS' && styles.activeToggle]} onPress={() => {
          setViewFeed('LABELS')
          logClickedEvent('Labels', "user_action", "feed_toggle")

        }}>
          <Icon name="LabelTopicIcon" size={15} style={[{ marginRight: 5, }, viewFeed === "LABELS" && styles.activeIcon]}></Icon>Labels</Button>
      {/* <Button onPress={() => setViewFeed('TOKENS')}>Tokens</Button> */}

      {/* <Button style={[styles.toggleButton, viewFeed === 'VIDEOS' && styles.activeToggle]} onPress={() => setViewFeed('VIDEOS')}>Videos</Button> */}

    </ScrollView>

      { viewFeed === 'NOTES' && <FeedComponent></FeedComponent> }

  { viewFeed === 'TOKENS' && <LaunchpadComponent></LaunchpadComponent> }

  { viewFeed === 'SHORTS' && <ShortVideosModule></ShortVideosModule> }

  { viewFeed === 'STREAM' && <StudioModule></StudioModule> }

  {/* { viewFeed === 'ARTICLES' && <ArticlesFeed></ArticlesFeed> } */}

  { viewFeed === 'LABELS' && <LabelFeed></LabelFeed> }

  {/* <Pressable
        style={styles.createPostButton}
        onPress={() => navigation.navigate('MainStack', { screen: 'CreateForm' })}
      >
        <AddPostIcon width={72} height={72} color={theme.colors.primary} />
      </Pressable> */}
    </View >
  );
};
