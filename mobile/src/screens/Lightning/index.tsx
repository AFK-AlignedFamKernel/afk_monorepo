import React from 'react';
import {ScrollView} from 'react-native';

import {LightningNetworkWalletView} from '../../modules/Lightning';
import {LightningNetworkScreenProps} from '../../types';
export const LightningNetworkScreen: React.FC<LightningNetworkScreenProps> = () => {
  return (
    <ScrollView showsVerticalScrollIndicator={true} persistentScrollbar={true}>
      <LightningNetworkWalletView></LightningNetworkWalletView>
    </ScrollView>
  );
};
