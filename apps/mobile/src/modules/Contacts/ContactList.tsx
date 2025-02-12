import { useQueryClient } from '@tanstack/react-query';
import { addContacts, Contact, getContacts, useContacts, useEditContacts, useProfile } from 'afk_nostr_sdk';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, Text, TextInput, View } from 'react-native';

import { Button } from '../../components';
import { useTheme } from '../../hooks';
import { useStyles } from '../../hooks';
import { useToast } from '../../hooks/modals';
import stylesheet from './styles';

interface ContactListProps {
  onClose?: () => void;
}

export const ContactList: React.FC<ContactListProps> = ({ onClose }) => {
  const [nostrAddress, setNostrAddress] = useState('');
  const [name, setName] = useState('');
  const [showProfileInfo, setShowProfileInfo] = useState(false);
  const [storedContacts, setStoredContacts] = useState<Contact[]>([]);
  const { theme } = useTheme();
  const { showToast } = useToast();
  const editContacts = useEditContacts();
  const contacts = useContacts();
  console.log('contacts', contacts.data?.flat());
  const queryClient = useQueryClient();

  // Destructure refetch from useProfile hook
  const { data: profile, refetch } = useProfile({ publicKey: nostrAddress });

  useEffect(() => {
    setShowProfileInfo(false);
  }, [nostrAddress]);

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
    setShowProfileInfo(true);
    if (nostrAddress) {
      await refetch();
    }
  };

  const handleAddContact = async () => {
    const newContact: Contact = {
      pubkey: nostrAddress,
      displayName: profile?.displayName || profile?.name || name,
      nip05: profile?.nip05,
      lud16: profile?.lud16,
      about: profile?.about,
      image: profile?.image,
      bio: profile?.bio,
    };

    if (profile?.pubkey) {
      await editContacts.mutateAsync(
        { pubkey: profile?.pubkey?.toString(), type: 'add' },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contacts'] });
            showToast({ type: 'success', title: 'Contact removed successfully' });
            // Update local storage contacts
            const updatedContacts = storedContacts.filter((c) => c.pubkey !== profile?.pubkey);
            setStoredContacts(updatedContacts);
          },
        },
      );
    }

    try {
      addContacts([newContact]);

      showToast({
        type: 'success',
        title: 'Contact added successfully',
      });

      onClose && onClose();
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Failed to add contact',
      });
    }
  };

  const renderProfileInfo = () => {
    if (!nostrAddress) return null;

    if (Object.keys(profile as object).length === 0)
      return (
        <View style={styles.profileInfo}>
          <Text style={styles.profileDetail}>Unrecognized address.</Text>
        </View>
      );

    return (
      <View style={styles.profileInfo}>
        <Text style={styles.infoTitle}>Profile Info:</Text>
        <Text style={styles.profileDetail}>
          <b>NIP05:</b> {profile?.nip05 || 'unrecognized'}
        </Text>

        {profile?.image && <Image style={styles.profileDetail} src={profile?.image}></Image>}
        <Text style={styles.profileDetail}>
          <b>Lightning address:</b> {profile?.lud16 || 'unrecognized'}
        </Text>
        <Text style={styles.profileDetail}>
          <b>Name:</b> {profile?.displayName || profile?.name || 'unrecognized'}
        </Text>
        {profile?.about && (
          <Text style={styles.profileDetail}>
            <b>About:</b> {profile.about || 'unrecognized'}
          </Text>
        )}
        {profile?.bio && (
          <Text style={styles.profileDetail}>
            <b>Bio:</b> {profile.bio || 'unrecognized'}
          </Text>
        )}
        <Button
          style={styles.hideInfoButton}
          textStyle={styles.hideInfoButtonText}
          onPress={() => setShowProfileInfo(false)}
        >
          Hide profile info
        </Button>
      </View>
    );
  };

  const [isViewContact, setIsViewContact] = useState(false);

  return (
    <View style={styles.addContactMainContainer}>
      <View style={styles.addContactContent}>
        {/* <View style={{ flex: 1 }}>
          <Button
            style={[styles.formActionButton, styles.formCancelButton]}
            textStyle={styles.formCancelButtonText}
            onPress={onClose}
          >
            Cancel
          </Button>
        </View> */}
        <View style={styles.addContactForm}>

          {/* {isViewContact && (
            <ScrollView showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
            >
              {contacts.data?.flat().map((contact) => (
                <View key={contact}>
                  <Text style={styles.contactItem}>{contact}</Text>
                </View>
              ))}
            </ScrollView>
          )}
          <Button style={styles.addContactForm}
            onPress={() => setIsViewContact(true)}
          >
            <Text style={styles.addContactTitle}>View contact</Text>
          </Button> */}
        </View>
        <View style={styles.addContactForm}>
          <Text style={styles.addContactTitle}>Add Contact</Text>

          <TextInput
            style={styles.addContactFormInput}
            value={name}
            onChangeText={setName}
            placeholder="Name"
            placeholderTextColor={theme.colors.textSecondary}
          />
          <TextInput
            style={styles.addContactFormInput}
            value={nostrAddress}
            onChangeText={setNostrAddress}
            placeholder="Address"
            placeholderTextColor={theme.colors.textSecondary}
          />
        </View>
        {showProfileInfo ? renderProfileInfo() : null}
        {nostrAddress !== '' && !showProfileInfo ? (
          <Button
            style={styles.checkAddressButton}
            textStyle={styles.checkAddressButtonText}
            onPress={handleCheckAddress}
          >
            Check address
          </Button>
        ) : null}
        <View style={styles.formButtonsContainer}>
          <Button
            style={[styles.formActionButton, styles.formCancelButton]}
            textStyle={styles.formCancelButtonText}
            onPress={onClose}
          >
            Cancel
          </Button>
          <Button
            style={[styles.formActionButton, styles.formAddButton]}
            textStyle={styles.formAddButtonText}
            onPress={handleAddContact}
            disabled={nostrAddress === '' || name === ''}
          >
            Add
          </Button>
        </View>
      </View>
    </View>
  );
};
