import React from 'react';
import {ScrollView} from 'react-native';
import {CashuView} from '../../modules/Cashu';
import {CashuWalletScreenProps} from '../../types';
export const CashuScreen: React.FC<CashuWalletScreenProps> = () => {
  return (
    <ScrollView showsVerticalScrollIndicator={true} persistentScrollbar={true}>
      <CashuView></CashuView>
    </ScrollView>
  );
};
