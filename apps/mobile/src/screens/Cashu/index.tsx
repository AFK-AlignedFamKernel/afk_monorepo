import React from 'react';
import {ScrollView} from 'react-native';

import {CashuView} from '../../modules/CashuWallet';
import {CashuWalletScreenProps} from '../../types';
export const CashuScreen: React.FC<CashuWalletScreenProps> = () => {
  return (
    <ScrollView showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator={false}>
      <CashuView></CashuView>
    </ScrollView>
  );
};
