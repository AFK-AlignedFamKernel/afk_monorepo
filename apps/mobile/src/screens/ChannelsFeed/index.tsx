import {Image, Pressable, View} from 'react-native';

import {AddPostIcon} from '../../assets/icons';
import {Header, TextButton} from '../../components';
import {useStyles, useTheme} from '../../hooks';
import {ChannelsFeedScreenProps} from '../../types';
import {ChannelsFeedComponent} from './ChannelsFeedComponent';
import stylesheet from './styles';

export const ChannelsFeed: React.FC<ChannelsFeedScreenProps> = ({navigation}) => {
  const {theme} = useTheme();
  const styles = useStyles(stylesheet);
  return (
    <View style={styles.container}>
      <Image
        style={styles.backgroundImage}
        // source={require('../../assets/feed-background.png')}
        source={require('../../assets/feed-background-afk.png')}
        resizeMode="cover"
      />
      {/* <Header /> */}

      <TextButton style={styles.cancelButton} onPress={navigation.goBack}>
        Back
      </TextButton>

      <ChannelsFeedComponent isStoryEnabled={true}></ChannelsFeedComponent>

      <Pressable
        style={styles.createPostButton}
        onPress={() => navigation.navigate('MainStack', {screen: 'CreateForm'})}
      >
        <AddPostIcon width={72} height={72} color={theme.colors.red} />
      </Pressable>
    </View>
  );
};
