import {Dimensions} from 'react-native';

import {ThemedStyleSheet} from '../../styles';

export default ThemedStyleSheet(() => ({
  videoContainer: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height - 60,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  actionsContainer: {
    position: 'absolute',
    right: 20,
    bottom: 40,
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    alignItems: 'center',
  },
}));
