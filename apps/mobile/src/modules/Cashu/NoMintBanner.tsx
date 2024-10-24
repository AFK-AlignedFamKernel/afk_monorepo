import '../../../applyGlobalPolyfills';

import React from 'react';
import {Text, View} from 'react-native';

import {InfoIcon} from '../../assets/icons';
import {Button} from '../../components';
import {useStyles, useTheme} from '../../hooks';
import stylesheet from './styles';

export const NoMintBanner = () => {
  const styles = useStyles(stylesheet);
  const {theme} = useTheme();

  return (
    <View style={styles.banner}>
      <InfoIcon width={35} height={35} color={theme.colors.primary} />
      <Text style={styles.bannerText}>Select a mint URL or receive ecash to get started.</Text>
      <View style={styles.bannerButtonsContainer}>
        <Button>Receive ecash</Button>
      </View>
    </View>
  );
};
