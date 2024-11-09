import {useQueryClient} from '@tanstack/react-query';
import {Contact, getContacts, updateContacts, useEditContacts} from 'afk_nostr_sdk';
import React, {useEffect, useState} from 'react';
import {Image, Text, TouchableOpacity, View} from 'react-native';

import {TrashIcon} from '../../assets/icons';
import {useStyles, useTheme} from '../../hooks';
import {useToast} from '../../hooks/modals';
import {Button} from '../Button';
import stylesheet from './styles';

interface ContactsRowProps {
  contacts?: Contact[];
  onContactPress?: (contact: Contact) => void;
  onAddContact?: () => void;
}

export const ContactsRow: React.FC<ContactsRowProps> = ({
  contacts,
  onContactPress,
  onAddContact,
}) => {
  const {showToast} = useToast();
  const styles = useStyles(stylesheet);
  const {theme} = useTheme();
  const editContacts = useEditContacts();
  const queryClient = useQueryClient();

  const [storedContacts, setStoredContacts] = useState<Contact[]>(contacts ?? []);

  useEffect(() => {
    const fetchContacts = () => {
      const contactsData = getContacts();
      if (contactsData) {
        setStoredContacts(JSON.parse(contactsData));
      }
    };
    fetchContacts();
  }, []);

  const handleRemoveContact = async (pubkey: string) => {
    try {
      /** TODO remove contact */

      const contacts = storedContacts.filter((c) => c?.pubkey != pubkey);
      updateContacts(contacts);

      await editContacts.mutateAsync(
        {pubkey, type: 'remove'},
        {
          onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['contacts']});
            showToast({type: 'success', title: 'Contact removed successfully'});
            // Update local storage contacts
            const updatedContacts = storedContacts.filter((c) => c.pubkey !== pubkey);
            setStoredContacts(updatedContacts);
          },
        },
      );
    } catch (error) {
      showToast({type: 'error', title: 'Failed to remove contact'});
    }
  };

  return (
    <View style={styles.contactsContainer}>
      <Text style={styles.contactsTitle}>Cashu Contacts</Text>
      <View style={styles.contactsContentContainer}>
        <View style={styles.contactsListContainer}>
          {storedContacts?.map((contact) => (
            <TouchableOpacity
              key={contact.pubkey}
              style={styles.contactContainer}
              onPress={() => onContactPress?.(contact)}
            >
              <Image
                source={
                  contact.image ? {uri: contact.image} : require('../../assets/pepe-logo.png')
                }
                style={styles.avatarImage}
              />
              <View style={styles.contactInfo}>
                <Text style={styles.contactName} numberOfLines={1}>
                  {contact.displayName || 'Unnamed'}
                </Text>
                <Text style={styles.contactAddress} numberOfLines={1}>
                  {contact.pubkey}
                </Text>
              </View>
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  onPress={() => handleRemoveContact(contact.pubkey || '')}
                  style={styles.actionButton}
                >
                  <TrashIcon width={20} height={20} color={theme.colors.errorDark} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        <Button
          onPress={onAddContact}
          style={styles.addContactButton}
          textStyle={styles.addContactButtonText}
        >
          Add Contact
        </Button>
      </View>
    </View>
  );
};
