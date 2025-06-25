import {NDKEvent} from '@nostr-dev-kit/ndk';
import {View} from 'react-native';

import {useStyles} from '../../hooks';
import {CardChannel} from './Card';
import stylesheet from './styles';

export type PostCardProps = {
  event?: NDKEvent;
};

export const ChannelComponent: React.FC<PostCardProps> = ({event}) => {
  const styles = useStyles(stylesheet);

  return (
    <View style={styles.container}>
      <CardChannel event={event} />
    </View>
  );
};
