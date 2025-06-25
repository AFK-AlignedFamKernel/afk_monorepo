import React from 'react';
import {ScrollView} from 'react-native';
import {OauthLoginProps} from '../../types';
import TwitterOauth from '../../modules/Oauth/twitter';
export const OauthScreen: React.FC<OauthLoginProps> = () => {
  return (
    <ScrollView showsVerticalScrollIndicator={true} persistentScrollbar={true}>
      <TwitterOauth></TwitterOauth>
    </ScrollView>
  );
};
