import { Contact, getContacts } from 'afk_nostr_sdk';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { useStyles } from '../../hooks';
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

  // const handleContactSelect = (contact: Contact) => {

  //   if (onContactPress) {
  //     onContactPress(contact)
  //   }
  //   if (contact.pubkey) {
  //     setReceiverPublicKey(contact.pubkey);
  //   }
  // };

  const styles = useStyles(stylesheet);
  return (
    <View style={styles.contactsContainer}>
      <Text style={styles.contactsTitle}>Contacts</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.contactsScrollContent}
      >
        <TouchableOpacity style={styles.addContactButton} onPress={onAddContact}>
          <Text style={styles.plusSign}>+</Text>
        </TouchableOpacity>

        {storedContacts?.map((contact) => (
          <View key={contact.pubkey} style={styles.contactAvatar}>
            <Image
              source={contact.image ? { uri: contact.image } : require('../../assets/pepe-logo.png')}
              style={styles.avatarImage}
            />
            <Text style={styles.contactName} numberOfLines={1}>
              {contact.displayName || 'Unnamed'}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};
