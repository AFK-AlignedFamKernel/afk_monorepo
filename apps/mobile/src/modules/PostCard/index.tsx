import {NDKEvent, NDKKind} from '@nostr-dev-kit/ndk';
import {useState} from 'react';
import React from 'react';
import {Pressable, View} from 'react-native';

import {Text} from '../../components';
import {useStyles} from '../../hooks';
import {Post} from '../Post';
import stylesheet from './styles';

export type PostCardProps = {
  event?: NDKEvent;
  isRepostProps?: boolean;
  isBookmarked?: boolean;
};
const hashtags = /\B#\w*[a-zA-Z]+\w*/g;

export const PostCard: React.FC<PostCardProps> = ({event, isRepostProps, isBookmarked}) => {
  const styles = useStyles(stylesheet);

  let repostedEvent = undefined;
  const [isRepost, setIsRepost] = useState(
    isRepostProps ?? event?.kind == NDKKind.Repost ? true : false,
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

const ClickableHashtag = ({hashtag, onPress}: any) => {
  const styles = useStyles(stylesheet);
  return (
    <Pressable onPress={onPress}>
      <Text style={styles.hashtagColor}>{hashtag}</Text>
    </Pressable>
  );
};

export const ContentWithClickableHashtags = ({content, onHashtagPress}: any) => {
  const parts = content.split(hashtags);
  const matches = content.match(hashtags);

  return (
    <Text color="textStrong" fontSize={13} lineHeight={20}>
      {parts.map((part: string, index: number) => (
        <React.Fragment key={index}>
          {part}
          {matches && index < parts.length - 1 && (
            <ClickableHashtag hashtag={matches[index]} onPress={onHashtagPress} />
          )}
        </React.Fragment>
      ))}
    </Text>
  );
};
