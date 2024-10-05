import '../../../applyGlobalPolyfills';

import React from 'react';
import { View, Text } from 'react-native';
import { useStyles, useTheme } from '../../hooks';
import stylesheet from './styles';
import { InfoIcon } from '../../assets/icons';
import { Button } from '../../components';


export const NoMintBanner = () => {
  const styles = useStyles(stylesheet);
  const {theme} = useTheme();

  return (
    <View style={styles.banner}>
      <InfoIcon width={30} height={30} color={theme.colors.primary} />
      <Text style={styles.bannerText}>
        Add a mint URL or receive ecash to get started.
      </Text>
      <View style={styles.bannerButtonsContainer}>
        <Button>Add mint URL</Button>
        <Button>Receive ecash</Button>
      </View>
    </View>
  );
};
