import React from 'react';
import {ScrollView} from 'react-native';
import {CashuWalletScreenProps} from '../../../types';
import TwitterOauth from '../../../modules/Oauth/twitter';
export const OauthScreen: React.FC<CashuWalletScreenProps> = () => {
  return (
    <ScrollView showsVerticalScrollIndicator={true} persistentScrollbar={true}>
      <TwitterOauth></TwitterOauth>
    </ScrollView>
  );
};
