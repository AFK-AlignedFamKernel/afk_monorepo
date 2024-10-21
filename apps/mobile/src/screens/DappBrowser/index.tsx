import React from 'react';
import {ScrollView} from 'react-native';
import {CashuView} from '../../modules/Cashu';
import {DappBrowserWalletScreenProps} from '../../types';
import DAppBrowser from '../../modules/DappBrowser';
export const DappBrowserScreen: React.FC<DappBrowserWalletScreenProps> = () => {
  return (
    <ScrollView showsVerticalScrollIndicator={true} persistentScrollbar={true}>
      <DAppBrowser></DAppBrowser>
    </ScrollView>
  );
};
