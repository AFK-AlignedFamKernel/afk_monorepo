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

  const styles = StyleSheet.create({
    centeredView: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)', // semi-transparent background
    },
    modalView: {
      width: Dimensions.get('window').width * 0.85, // Reduced from 0.9
      maxHeight: Dimensions.get('window').height * 0.8,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    tabContainer: {
      flexDirection: 'row',
      marginBottom: 20,
      backgroundColor: theme.colors.messageCard,
      borderRadius: 8,
      padding: 4,
    },
    tab: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 6,
      marginHorizontal: 2,
    },
    activeTab: {
      backgroundColor: theme.colors.primary,
    },
    inactiveTab: {
      backgroundColor: 'transparent',
    },
    tabText: {
      color: theme.colors.textSecondary,
      fontSize: 16,
      textAlign: 'center',
    },
    activeTabText: {
      color: theme.colors.white,
      fontWeight: '600',
    },
    inputSection: {
      marginBottom: 24,
    },
    inputLabel: {
      fontSize: 16,
      color: theme.colors.text,
      marginBottom: 8,
    },
    input: {
      backgroundColor: theme.colors.messageCard,
      borderRadius: 8,
      padding: 12,
      color: theme.colors.text,
      marginBottom: 8, // Reduced from 16
      borderWidth: 1,
      borderColor: theme.colors.primary, // Add blue border like in the image
    },
    actionButton: {
      backgroundColor: theme.colors.primary,
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginBottom: 12,
    },
    actionButtonText: {
      color: theme.colors.white,
      fontSize: 16,
      fontWeight: '500',
    },
    closeButton: {
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
      backgroundColor: theme.colors.messageCard,
    },
    closeButtonText: {
      color: theme.colors.text,
      fontSize: 16,
    },
    profileInfo: {
      marginVertical: 16,
    },
    profileDetail: {
      fontSize: 14,
      color: theme.colors.textSecondary, // Using secondary text color for the gray appearance
      marginBottom: 4,
      lineHeight: 20,
    },
    contactItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      marginBottom: 8,
    },
    contactImage: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 12,
      backgroundColor: theme.colors.messageCard,
    },
    contactInfo: {
      flex: 1,
    },
    removeButton: {
      backgroundColor: theme.colors.red, // Changed from 'error' to 'red'
      padding: 8,
      borderRadius: 6,
    },
    removeButtonText: {
      color: theme.colors.white,
      fontSize: 12,
    },
    separator: {
      height: 1,
      backgroundColor: theme.colors.background,
      marginVertical: 8,
    },
  });

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
