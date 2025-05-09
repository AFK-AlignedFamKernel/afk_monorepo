import React from 'react';
import {View} from 'react-native';
import {ShortVideosScreenProps} from '../../../types';
import ShortVideosModule from '../../../modules/ShortVideos';

export const ShortVideoNostrScreen: React.FC<ShortVideosScreenProps> = () => {
  return (
    <View style={{ flex: 1 }}>
      <ShortVideosModule />
    </View>
  );
};
