import {StyleSheet} from 'react-native';
import {Spacing} from '../../styles';

export default StyleSheet.create({
  container: {
    alignItems: 'center',
    // width: 100, // Set a fixed width for each item
    // height: 100, // Set a fixed height for each item
    // justifyContent: 'center',
    // // alignItems: 'center',
    // marginHorizontal: 10,
    // backgroundColor: '#ddd',
  },

  imageContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius:15
  },
  image: {
    position: 'absolute',
    width: 35,
    height: 35,
    borderRadius:15
  },

  name: {
    paddingTop: Spacing.xxsmall,
  },
});
