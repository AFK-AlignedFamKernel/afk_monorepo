// import Clipboard from '@react-native-clipboard/clipboard';
import * as Clipboard from 'expo-clipboard';
import React from 'react';
import { Pressable, StyleProp, Text, TextStyle, View, ViewStyle } from 'react-native';

import { useStyles } from '../../hooks';
import { useToast } from '../../hooks/modals';
import { IconButton } from '../IconButton';
import stylesheet from './styles';

interface AddressProps {
  address: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const AddressComponent = ({ address, style, textStyle }: AddressProps) => {
  const styles = useStyles(stylesheet);
  const { showToast } = useToast();

  const shortenAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 10)}...${address.substring(address.length - 10)}`;
  };

  const copyToClipboard = async () => {
    if (!address) return;
    await Clipboard.setStringAsync(address);
    showToast({ type: 'info', title: 'Public key copied to the clipboard' });
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.address, textStyle]}>{shortenAddress(address)}</Text>
      <Pressable>
        <IconButton
          style={styles.icon}
          size={16}
          icon="CopyIconStack"
          color="primary"
          onPress={copyToClipboard}
        />
      </Pressable>
    </View>
  );
};
