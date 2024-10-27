import {useQueryClient} from '@tanstack/react-query';
import {addContacts, Contact, getContacts, useEditContacts, useProfile} from 'afk_nostr_sdk';
import React, {useEffect, useState} from 'react';
import {
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {useTheme} from '../../hooks';
import {useToast} from '../../hooks/modals';
import {useStyles} from '../../hooks';
import stylesheet from './styles';

interface ContactListProps {
  onClose: () => void;
}

export const ContactList: React.FC<ContactListProps> = ({onClose}) => {
  const [nostrAddress, setNostrAddress] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'add'
  const [storedContacts, setStoredContacts] = useState<Contact[]>([]);
  const {theme} = useTheme();
  const {showToast} = useToast();
  const editContacts = useEditContacts();
  const queryClient = useQueryClient();

  // Destructure refetch from useProfile hook
  const {data: profile, refetch} = useProfile({publicKey: nostrAddress});

  // Fetch contacts when component mounts
  useEffect(() => {
    const fetchContacts = () => {
      const contactsData = getContacts();
      if (contactsData) {
        setStoredContacts(JSON.parse(contactsData));
      }
    };
    fetchContacts();
  }, []);

  const styles = useStyles(stylesheet);

  // Add handler for Check address button
  const handleCheckAddress = async () => {
    if (nostrAddress) {
      await refetch();
    }
  };

  const handleAddContact = () => {
    if (!profile) return;

    console.log('Adding new contact with profile:', profile);

    const newContact: Contact = {
      pubkey: nostrAddress,
      displayName: profile.displayName || profile.name,
      nip05: profile.nip05,
      lud16: profile.lud16,
      about: profile.about,
      bio: profile.bio,
    };

    console.log('Created contact object:', newContact);

    try {
      addContacts([newContact]);
      console.log('Contact successfully added to storage');

      showToast({
        type: 'success',
        title: 'Contact added successfully',
      });
      console.log('Toast shown, closing modal');

      onClose();
    } catch (error) {
      console.error('Error adding contact:', error);
      showToast({
        type: 'error',
        title: 'Failed to add contact',
      });
    }
  };

  const renderProfileInfo = () => {
    if (!nostrAddress || !profile) return null;

    return (
      <View style={styles.profileInfo}>
        <Text style={styles.profileDetail}>NIP05: {profile.nip05 || 'unrecognized'}</Text>
        <Text style={styles.profileDetail}>
          Lightning address: {profile.lud16 || 'unrecognized'}
        </Text>
        <Text style={styles.profileDetail}>
          Name: {profile.displayName || profile.name || 'unrecognized'}
        </Text>
        <Text style={styles.profileDetail}>About: {profile.about || 'unrecognized'}</Text>
        <Text style={styles.profileDetail}>Bio: {profile.bio || 'unrecognized'}</Text>
      </View>
    );
  };

  const renderAddNewContact = () => (
    <View>
      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Add a contact with Nostr address</Text>
        <TextInput
          style={styles.input}
          value={nostrAddress}
          onChangeText={setNostrAddress}
          placeholder="Enter Nostr address"
          placeholderTextColor={theme.colors.textSecondary}
        />
      </View>

      {renderProfileInfo()}

      <TouchableOpacity style={styles.actionButton} onPress={handleCheckAddress}>
        <Text style={styles.actionButtonText}>Check address</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton} disabled={!profile} onPress={handleAddContact}>
        <Text style={styles.actionButtonText}>Add contact</Text>
      </TouchableOpacity>
    </View>
  );

  const handleRemoveContact = async (pubkey: string) => {
    try {
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

  const renderAllContacts = () => (
    <ScrollView>
      <Text style={styles.inputLabel}>All contacts</Text>
      {storedContacts.length === 0 ? (
        <Text style={styles.profileDetail}>No contacts found</Text>
      ) : (
        storedContacts.map((contact, index) => (
          <View key={contact.pubkey} style={styles.contactItem}>
            <Image
              source={contact.image ? {uri: contact.image} : require('../../assets/pepe-logo.png')}
              style={styles.contactImage}
            />
            <View style={styles.contactInfo}>
              <Text style={styles.profileDetail}>{contact.displayName || 'Unnamed Contact'}</Text>
            </View>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => contact.pubkey && handleRemoveContact(contact.pubkey)}
            >
              <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
            {index !== storedContacts.length - 1 && <View style={styles.separator} />}
          </View>
        ))
      )}
    </ScrollView>
  );

  return (
    <Modal animationType="fade" transparent={true} visible={true} onRequestClose={onClose}>
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'all' ? styles.activeTab : styles.inactiveTab]}
              onPress={() => setActiveTab('all')}
            >
              <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
                All contacts
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'add' ? styles.activeTab : styles.inactiveTab]}
              onPress={() => setActiveTab('add')}
            >
              <Text style={[styles.tabText, activeTab === 'add' && styles.activeTabText]}>
                Add new contact
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'all' ? renderAllContacts() : renderAddNewContact()}

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
