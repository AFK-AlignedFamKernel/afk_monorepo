import React from 'react';
import {Image, Pressable, Text, View} from 'react-native';

import {useStyles} from '../../../hooks';
import stylesheet from './styles';

export type ConversationPreviewProps = {
  conversation: {
    id: number;
    pubkey: number;
    created_at: string;
    decryptedContent: string;
    senderName: string;
    receiverName: string;
    user: any;
    name: string;
  };
  onPressed: () => void;
};

export const Conversation = ({conversation, onPressed}: ConversationPreviewProps) => {
  const styles = useStyles(stylesheet);

  const avatar = conversation?.user?.avatar
    ? {uri: conversation?.user?.avatar}
    : require('../../../assets/pepe-logo.png');

  return (
    <Pressable style={styles.container} onPress={onPressed}>
      <Image source={avatar} style={styles.avatar} />
      <View style={styles.textContainer}>
        <Text style={styles.name}>@{conversation.name || 'No Name'}</Text>
        <Text numberOfLines={1} ellipsizeMode="middle" style={styles.pub}>
          {conversation?.pubkey}
        </Text>
      </View>
    </Pressable>
  );
};
