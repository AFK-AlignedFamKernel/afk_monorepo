import React from 'react';
import {View} from 'react-native';

import {LightningNetworkWalletView} from '../../modules/Lightning';
import {LightningNetworkScreenProps} from '../../types';

export const LightningNetworkScreen: React.FC<LightningNetworkScreenProps> = () => {
  return (
    <View>
      <LightningNetworkWalletView></LightningNetworkWalletView>
    </View>
  );
};
