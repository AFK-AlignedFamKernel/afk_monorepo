import {NDKUser} from '@nostr-dev-kit/ndk';
import {useQueryClient} from '@tanstack/react-query';
import {useSendPrivateMessage} from 'afk_nostr_sdk';
import React from 'react';
import {View} from 'react-native';

import {useStyles} from '../../../hooks';
import {useToast} from '../../../hooks/modals';
import {Divider} from '../../Divider';
import {IconButton} from '../../IconButton';
import {Input} from '../../Input';
import {KeyboardFixedView} from '../../Skeleton/KeyboardFixedView';
import stylesheet from './styles';

interface IFormPrivateMessage {
  publicKey?: string;
  user?: NDKUser;
  receiverPublicKeyProps?: string;
  handleClose?: () => void;
}
export const FormPrivateMessage: React.FC<IFormPrivateMessage> = ({
  user,
  publicKey,
  handleClose,
  receiverPublicKeyProps,
}) => {
  const styles = useStyles(stylesheet);
  const avatar = user?.profile?.banner ?? require('../../../assets/pepe-logo.png');

  const [receiverPublicKey, setReceiverPublicKey] = React.useState(receiverPublicKeyProps);
  const [message, setMessage] = React.useState<string | undefined>();
  const sendPrivateMessage = useSendPrivateMessage();
  const {showToast} = useToast();
  const queryClient = useQueryClient();

  const sendMessage = async (message: string) => {
    if (!receiverPublicKey) {
      showToast({title: 'Please choose a Nostr public key', type: 'error'});
      return;
    }

    //todo: integrate hook here
    //todo: encrypt message
    //todo: send message
    await sendPrivateMessage.mutateAsync(
      {receiverPublicKeyProps: receiverPublicKey, content: message},
      {
        onSuccess: () => {
          showToast({title: 'Message sent', type: 'success'});
          queryClient.invalidateQueries({
            queryKey: ['messagesSent'],
          });
          handleClose && handleClose();
        },
        onError() {
          showToast({title: 'Error sending message', type: 'error'});
        },
      },
    );
  };

  const handleSendMessage = () => {
    if (!message) {
      showToast({title: 'Please add a content', type: 'error'});
      return;
    }
    if (!receiverPublicKey) {
      showToast({title: 'Please choose a Nostr public key', type: 'error'});
      return;
    }

    sendMessage(message);
  };

  return (
    <>
      {/* <View style={styles.header}>
				<IconButton icon="ChevronLeftIcon" size={20} onPress={handleGoBack} style={styles.backButton} />
				<View style={styles.headerContent}>
					<Image source={avatar} style={styles.avatar} />
					<Text style={styles.name}>{user.name}</Text>
				</View>
			</View> */}
      <View style={styles.container}>
        <Input
          value={receiverPublicKey}
          onChangeText={setReceiverPublicKey}
          placeholder="Receiver"
        />
        <KeyboardFixedView containerProps={{style: styles.commentInputContainer}}>
          <Divider />

          <View style={styles.commentInputContent}>
            <Input
              value={message}
              onChangeText={setMessage}
              containerStyle={styles.commentInput}
              placeholder="Type your message"
            />

            <IconButton icon="SendIcon" size={20} onPress={handleSendMessage} />
          </View>
        </KeyboardFixedView>
        {/* <MessageInput onSend={handleSendMessage} /> */}
      </View>
    </>
  );
};
