import {StyleSheet} from 'react-native';

import {Spacing} from '../../styles';

export default StyleSheet.create({
  container: {
    gap: Spacing.small,
    // width: 100, // Set a fixed width for each item
    // height: 100, // Set a fixed height for each item
    // justifyContent: 'center',
    // // alignItems: 'center',
    // marginHorizontal: 10,
    // backgroundColor: '#ddd',
  },

  image: {
    borderRadius: 15,
    height: 35,
    position: 'absolute',
    width: 35,
  },
  imageContainer: {
    alignItems: 'center',
    borderRadius: 15,
    display: 'flex',
    justifyContent: 'center',
    position: 'relative',
  },

  name: {
    paddingTop: Spacing.xxsmall,
  },
});
