import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Alert} from 'react-native';
// import Clipboard from '@react-native-clipboard/clipboard';
import {MaterialIcons} from '@expo/vector-icons';
import stylesheet from './styles';
import {useStyles} from '../../hooks';

interface AddressProps {
  address: string;
}

export const AddressComponent = ({address}: AddressProps) => {
  const shortenAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 10)}...${address.substring(address.length - 10)}`;
  };

  const styles = useStyles(stylesheet);
  const copyToClipboard = () => {
    // Clipboard.setString(address);
    Alert.alert('Copied!', 'Blockchain address copied to clipboard.');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.address}>{shortenAddress(address)}</Text>
      <TouchableOpacity>
        <MaterialIcons name="content-copy" size={20} color="green" />
      </TouchableOpacity>
    </View>
  );
};
