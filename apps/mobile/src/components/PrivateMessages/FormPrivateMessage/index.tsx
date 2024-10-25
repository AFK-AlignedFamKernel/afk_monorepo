import {NDKUser} from '@nostr-dev-kit/ndk';
import {useQueryClient} from '@tanstack/react-query';
import {useSendPrivateMessage, Contact, getContacts} from 'afk_nostr_sdk';
import React, {useEffect, useState} from 'react';
import {View} from 'react-native';

import {useStyles} from '../../../hooks';
import {useToast} from '../../../hooks/modals';
import {Divider} from '../../Divider';
import {IconButton} from '../../IconButton';
import {Input} from '../../Input';
import {KeyboardFixedView} from '../../Skeleton/KeyboardFixedView';
import {ContactsRow} from '../../ContactsRow';
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
  const [storedContacts, setStoredContacts] = useState<Contact[]>([]);
  const avatar = user?.profile?.banner ?? require('../../../assets/pepe-logo.png');

  const [receiverPublicKey, setReceiverPublicKey] = React.useState(receiverPublicKeyProps);
  const [message, setMessage] = React.useState<string | undefined>();
  const sendPrivateMessage = useSendPrivateMessage();
  const {showToast} = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchContacts = () => {
      const contactsData = getContacts();
      if (contactsData) {
        setStoredContacts(JSON.parse(contactsData));
      }
    };
    fetchContacts();
  }, []);

  const handleContactSelect = (contact: Contact) => {
    if (contact.pubkey) {
      setReceiverPublicKey(contact.pubkey);
    }
  };

  const sendMessage = async (message: string) => {
    if (!receiverPublicKey) {
      showToast({title: 'Please choose a Nostr public key', type: 'error'});
      return;
    }

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

  return (
    <View style={styles.container}>
      <ContactsRow 
        contacts={storedContacts}
        onContactPress={handleContactSelect}
        onAddContact={() => {
          // Handle add contact action
          showToast({title: 'Add contact functionality to be implemented', type: 'info'});
        }}
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
          <IconButton icon="SendIcon" size={20} onPress={() => message && sendMessage(message)} />
        </View>
      </KeyboardFixedView>
    </View>
  );
};
