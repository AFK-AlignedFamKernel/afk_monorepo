import {NDKEvent, NDKKind} from '@nostr-dev-kit/ndk';
import {useState} from 'react';
import {View} from 'react-native';

import {useStyles} from '../../hooks';
import {Post} from '../Post';
import stylesheet from './styles';

export type PostCardProps = {
  event?: NDKEvent;
  isRepostProps?: boolean;
  isBookmarked?: boolean;
};

export const PostCard: React.FC<PostCardProps> = ({event, isRepostProps, isBookmarked}) => {
  const styles = useStyles(stylesheet);

  let repostedEvent = undefined;
  const [isRepost, setIsRepost] = useState(
    isRepostProps ?? (event?.kind == NDKKind.Repost ? true : false),
  );

  if (event?.kind == NDKKind.Repost) {
    repostedEvent = JSON.stringify(event?.content);
  }
  return (
    <View style={styles.container}>
      <Post
        event={event}
        asComment={false}
        repostedEventProps={repostedEvent}
        isRepost={isRepost}
        isBookmarked={isBookmarked}
      />
    </View>
  );
};
