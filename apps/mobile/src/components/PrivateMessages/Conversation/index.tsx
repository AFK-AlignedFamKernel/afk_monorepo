import React from 'react';
import {Image, Pressable, Text, View} from 'react-native';

import {useStyles} from '../../../hooks';
import {ConversationType} from '../../../types/messages';
import stylesheet from './styles';

export type ConversationPreviewProps = {
  conversation: ConversationType;
  onPressed: () => void;
};

export const Conversation: React.FC<ConversationPreviewProps> = ({conversation, onPressed}) => {
  const styles = useStyles(stylesheet);

  const user = conversation.user;
  const avatar = user.avatar ? {uri: user.avatar} : require('../../../assets/pepe-logo.png');

  return (
    <Pressable style={styles.container} onPress={onPressed}>
      <Image source={avatar} style={styles.avatar} />
      <View style={styles.textContainer}>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.handle}>{user.handle}</Text>
      </View>
    </Pressable>
  );
};
