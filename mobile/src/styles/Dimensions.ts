import {Dimensions as RNDimensions} from 'react-native';

const DESKTOP_BREAKPOINT = 768;

export const Dimensions = {
  get isDesktop() {
    return RNDimensions.get('window').width >= DESKTOP_BREAKPOINT;
  },

  get width() {
    return RNDimensions.get('window').width;
  },

  get height() {
    return RNDimensions.get('window').height;
  },
};
