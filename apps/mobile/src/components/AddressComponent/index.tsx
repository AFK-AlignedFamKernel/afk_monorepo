// import Clipboard from '@react-native-clipboard/clipboard';
import {MaterialIcons} from '@expo/vector-icons';
import React from 'react';
import {Alert, Text, TouchableOpacity, View, StyleProp, ViewStyle, TextStyle} from 'react-native';

import {useStyles} from '../../hooks';
import stylesheet from './styles';

interface AddressProps {
  address: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const AddressComponent = ({address, style, textStyle}: AddressProps) => {
  const shortenAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 10)}...${address.substring(address.length - 10)}`;
  };

  const styles = useStyles(stylesheet);
  const copyToClipboard = () => {
    Alert.alert('Copied!', 'Blockchain address copied to clipboard.');
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.address, textStyle]}>{shortenAddress(address)}</Text>
      <TouchableOpacity>
        <MaterialIcons name="content-copy" size={20} color="green" />
      </TouchableOpacity>
    </View>
  );
};
