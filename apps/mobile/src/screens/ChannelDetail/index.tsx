import {View} from 'react-native';

import {useStyles} from '../../hooks';
import {ChannelDetailComponent} from '../../modules/ChannelDetailPage';
import {ChannelDetailScreenProps} from '../../types';
import stylesheet from './styles';
import { Header, IconButton } from '../../components';

export const ChannelDetail: React.FC<ChannelDetailScreenProps> = ({navigation, route}) => {
  const {postId, post} = route.params;

  const styles = useStyles(stylesheet);

  return (
    <View style={styles.container}>
      <Header
        showLogo={false}
        left={<IconButton icon="ChevronLeftIcon" size={24} onPress={navigation.goBack}
        />}
        // right={<IconButton icon="MoreHorizontalIcon" size={24} ></IconButton>}
       
        title="ChannelDetail"
      />
      <ChannelDetailComponent route={route} navigation={navigation}></ChannelDetailComponent>
    </View>
  );
};
