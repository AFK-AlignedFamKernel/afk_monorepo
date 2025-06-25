import React from 'react';
import {ScrollView} from 'react-native';

import DAppBrowser from '../../modules/DappBrowser';
import {DappBrowserWalletScreenProps} from '../../types';
export const DappBrowserScreen: React.FC<DappBrowserWalletScreenProps> = () => {
  return (
    <ScrollView showsVerticalScrollIndicator={true} persistentScrollbar={true}>
      <DAppBrowser></DAppBrowser>
    </ScrollView>
  );
};
