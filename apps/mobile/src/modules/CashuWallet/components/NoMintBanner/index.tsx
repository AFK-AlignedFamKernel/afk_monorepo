/* eslint-disable @typescript-eslint/no-non-null-assertion */
import '../../../../../applyGlobalPolyfills';

import React from 'react';
import {Text, View} from 'react-native';

import {InfoIcon} from '../../../../assets/icons';
import {Button} from '../../../../components';
import {useStyles, useTheme} from '../../../../hooks';
import stylesheet from './styles';

export type BannerProps = {
  onClick: () => void;
  addingMint: boolean;
};

export const NoMintBanner: React.FC<BannerProps> = ({onClick, addingMint}) => {
  const styles = useStyles(stylesheet);
  const {theme} = useTheme();

  return (
    <View style={styles.banner}>
      <InfoIcon width={55} height={55} color={theme.colors.primary} />
      <Text style={styles.bannerText}>Add a mint to get started.</Text>
      <Text style={styles.orText}>or</Text>
      <View style={styles.bannerButtonsContainer}>
        <Button onPress={onClick}>
          {addingMint ? 'Configuring mint...' : 'Connect to default mint'}
        </Button>
      </View>
    </View>
  );
};
