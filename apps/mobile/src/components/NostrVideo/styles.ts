import {Dimensions} from 'react-native';

import {ThemedStyleSheet} from '../../styles';

export default ThemedStyleSheet(() => ({
  videoContainer: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  video: {
    width: '100%',
    height: '100%',
  },
}));
