// CustomProfileMenu.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import stylesheet from "./styles"
import { useStyles } from '../../hooks';
import { useAccount } from '@starknet-react/core';
import { useNavigation } from '@react-navigation/native';
import { MainStackNavigationProps } from '../../types';
import { useWalletModal } from '../../hooks/modals';
const CustomProfileMenu = () => {
  const account = useAccount()

  const walletModal = useWalletModal();

  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };
  const onConnect = async () => {
    if (!account.address) {
      walletModal.show();

      // const result = await waitConnection();
      // if (!result) return;
    }
  };

  const navigation = useNavigation<MainStackNavigationProps>()
  const styles = useStyles(stylesheet)
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={toggleMenu} style={styles.profileButton}>
        <Text style={styles.profileButtonText}>Profile</Text>
      </TouchableOpacity>

      {account?.address &&
        <View>
          <Text>Connected</Text>
        </View>}
      {!account?.address &&
        <View>
          <TouchableOpacity onPress={() => onConnect()}>
            <Text style={styles.dropdownItem}>Help</Text>
          </TouchableOpacity>
        </View>
      }


      {isOpen && (
        <View style={styles.dropdown}>


          <TouchableOpacity onPress={() =>
            navigation.push("Settings")
          }>

            <Text style={styles.dropdownItem}>Account Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() =>
            navigation.push("Settings")


          }>
            <Text style={styles.dropdownItem}>Log Out</Text>
          </TouchableOpacity>
          {/* <TouchableOpacity onPress={() => alert('Help')}>
            <Text style={styles.dropdownItem}>Help</Text>
          </TouchableOpacity> */}
        </View>
      )}
    </View>
  );
};

export default CustomProfileMenu;