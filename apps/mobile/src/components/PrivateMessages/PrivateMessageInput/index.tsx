import React, { useState } from 'react';
import { View } from 'react-native';
import stylesheet from './styles';
import { KeyboardFixedView } from '../../Skeleton/KeyboardFixedView';
import { Divider } from '../../Divider';
import { Input } from '../../Input';
import { IconButton } from '../../IconButton';
import { useStyles } from '../../../hooks';

export type MessageInputProps = {
	onSend: (message: string) => void;
};

export const MessageInput: React.FC<MessageInputProps> = ({ onSend }) => {
  const styles = useStyles(stylesheet);
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim()) {
      onSend(message);
      setMessage('');
    }
  };

  return (
    <KeyboardFixedView containerProps={{style: styles.commentInputContainer}}>
        <Divider />

        <View style={styles.commentInputContent}>
          <Input
            value={message}
            onChangeText={setMessage}
            containerStyle={styles.commentInput}
            placeholder="Type your message"
          />

          <IconButton icon="SendIcon" size={20} onPress={handleSend} />
        </View>
      </KeyboardFixedView>
  );
};
