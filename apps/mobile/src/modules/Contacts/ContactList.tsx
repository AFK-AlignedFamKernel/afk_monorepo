import React, {useState, useEffect} from 'react';
import {View, Text, TextInput, Modal, TouchableOpacity, StyleSheet, Dimensions} from 'react-native';
import {useStyles, useTheme} from '../../hooks';
import {useProfile} from 'afk_nostr_sdk';

interface ContactListProps {
  onClose: () => void;
}

export const ContactList: React.FC<ContactListProps> = ({ onClose }) => {
  const [nostrAddress, setNostrAddress] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'add'
  const { theme } = useTheme();

  // Add profile data fetching
  const {data: profile} = useProfile({publicKey: nostrAddress});

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
  });

  // Add profile display section
  const renderProfileInfo = () => {
    if (!profile) return null;
    
    return (
      <View style={styles.profileInfo}>
        <Text style={styles.profileDetail}>
          NIP05: {profile.nip05 || 'unrecognized'}
        </Text>
        <Text style={styles.profileDetail}>
          Lightning address: {profile.lud16 || 'unrecognized'}
        </Text>
        <Text style={styles.profileDetail}>
          Name: {profile.displayName || profile.name || 'unrecognized'}
        </Text>
        <Text style={styles.profileDetail}>
          About: {profile.about || 'unrecognized'}
        </Text>
        <Text style={styles.profileDetail}>
          Bio: {profile.bio || 'unrecognized'}
        </Text>
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

      <TouchableOpacity style={styles.actionButton}>
        <Text style={styles.actionButtonText}>Check address</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.actionButton}
        disabled={!profile}
      >
        <Text style={styles.actionButtonText}>Add contact</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAllContacts = () => (
    <View>
      <Text style={styles.inputLabel}>Your contacts will appear here</Text>
      {/* Add your contacts list here */}
    </View>
  );

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={true}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[
                styles.tab,
                activeTab === 'all' ? styles.activeTab : styles.inactiveTab
              ]}
              onPress={() => setActiveTab('all')}
            >
              <Text style={[
                styles.tabText,
                activeTab === 'all' && styles.activeTabText
              ]}>
                All contacts
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.tab,
                activeTab === 'add' ? styles.activeTab : styles.inactiveTab
              ]}
              onPress={() => setActiveTab('add')}
            >
              <Text style={[
                styles.tabText,
                activeTab === 'add' && styles.activeTabText
              ]}>
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
