import React from 'react';
import {ScrollView} from 'react-native';
import {CashuView} from '../../modules/Cashu';
import {DappBrowserWalletScreenProps} from '../../types';
export const DappBrowserScreen: React.FC<DappBrowserWalletScreenProps> = () => {
  return (
    <ScrollView showsVerticalScrollIndicator={true} persistentScrollbar={true}>
      <CashuView></CashuView>
    </ScrollView>
  );
};
