import {StyleSheet} from 'react-native';

import {Spacing} from '../../styles';

export default StyleSheet.create({
  block: {
    width: '100%',
  },
  container: {
    alignItems: 'center',
    borderRadius: 6,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xlarge,
    paddingVertical: Spacing.medium,
  },
});
