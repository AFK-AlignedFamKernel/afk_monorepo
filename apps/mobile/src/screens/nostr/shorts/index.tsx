import React from 'react';
import {ScrollView} from 'react-native';
import {ShortVideosScreenProps} from '../../../types';
import ShortVideosModule from '../../../modules/ShortVideos';
export const ShortVideoNostrScreen: React.FC<ShortVideosScreenProps> = () => {
  return (
    <ScrollView showsVerticalScrollIndicator={true} persistentScrollbar={true}>
      <ShortVideosModule></ShortVideosModule>
    </ScrollView>
  );
};
