import { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk';
import { View } from 'react-native';
import { useStyles } from '../../hooks';
import { Post } from '../Post';
import stylesheet from './styles';
import { useState } from 'react';

export type PostCardProps = {
  event?: NDKEvent;
  isRepostProps?:boolean;
};

export const PostCard: React.FC<PostCardProps> = ({ event, isRepostProps }) => {
  const styles = useStyles(stylesheet);

  let repostedEvent = undefined;
  const [isRepost, setIsRepost] = useState(isRepostProps ?? event?.kind == NDKKind.Repost ? true : false)

  if (event?.kind == NDKKind.Repost) {
    repostedEvent = JSON.stringify(event?.content)
  }
  return (
    <View style={styles.container}>
      <Post event={event} repostedEventProps={repostedEvent} isRepost={isRepost}/>
    </View>
  );
};
