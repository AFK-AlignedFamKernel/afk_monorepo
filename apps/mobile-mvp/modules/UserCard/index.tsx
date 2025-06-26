import {NDKEvent} from '@nostr-dev-kit/ndk';
import {View} from 'react-native';

import {useStyles} from '../../hooks';
import {Card} from './Card/index';
import stylesheet from './styles';

export type UserCardProps = {
  event?: NDKEvent;
};

export const UserCard: React.FC<UserCardProps> = ({event}) => {
  const styles = useStyles(stylesheet);

  return (
    <View style={styles.container}>
      <Card event={event} />
    </View>
  );
};
